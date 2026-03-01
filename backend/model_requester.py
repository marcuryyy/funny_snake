import json
import asyncio
from typing import Optional, Dict, Any
from vector_base import (
    get_rag_index,
    get_history_index,
    find_similar_letter,
    save_letter_to_history,
)
import httpx
from cfg import *


class LLMPipeline:
    def __init__(
        self,
        base_url: str = LLM_BASE_URL,
        api_key: str = LLM_API_KEY,
        model: str = LLM_MODEL,
        timeout: float = 120.0,
        examples_path: str = "./examples.json",
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.model = model
        self.timeout = httpx.Timeout(timeout)
        self.examples_path = examples_path
        self.system_prompt = (
            "Ты - мастер в извлечении данных из писем. "
            "Ты отвечаешь ТОЛЬКО JSON словарем, без MARKDOWN, комментариев и других вещей. "
        )

        self._rag_db = None
        self._history_db = None

    @property
    def rag_db(self):
        if self._rag_db is None:
            self._rag_db = get_rag_index()
        return self._rag_db

    @property
    def history_db(self):
        if self._history_db is None:
            self._history_db = get_history_index()
        return self._history_db

    def _load_examples(self) -> str:
        """Формирует промпт с примерами (few-shot)."""
        try:
            with open(self.examples_path, encoding="utf-8") as f:
                examples: list[dict] = json.load(f)
        except FileNotFoundError:
            examples = []

        few_shot_prompt = (
            "Изучи данные примеры. Они помогут тебе правильно извлечь информацию из поступающих писем. **НЕЛЬЗЯ** брать информацию из ПРИМЕРОВ!."
            "**emotional_tone** может быть одним из: положительное, нейтральное, негативное. Его **НУЖНО** определять всегда!"
            " Для остальных полей **КРОМЕ emotional_tone**, если нет информации, оставь пустую строку:"
            "**НАЧАЛО БЛОКА ПРИМЕРОВ\n\n**"
        )
        example_text = ""

        for idx, example in enumerate(examples):
            full_text = example.pop("full_letter_text")
            example_text += f"Пример {idx + 1}:\n{full_text}\n\n"
            expected_json_str = json.dumps(example, ensure_ascii=False, indent=2)
            example_text += f"Ожидаемый json:\n{expected_json_str}\n"
            example_text += (
                "Обрати внимание на название полей. Они должны быть точно такими же. "
                "**emotional_tone** может быть одним из: положительное, нейтральное, негативное. Определять нужно всегда."
                "Для остальных полей **КРОМЕ emotional_tone**, если нет информации, оставь пустую строку\n\n"
            )

        if examples:
            example_text += "**ОБРАТИ ВНИМАНИЕ** на то, КАК ВЫГЛЯДИТ factory_number: ОН **ВСЕГДА** содержит в себе **9 ЦИФР**. ДРУГИЕ ВАРИАНТЫ НЕВОЗМОЖНЫ! НЕ БЕРИ ИНФОРМАЦИЮ ИЗ ПРИМЕРОВ!\n"

        example_text += "**КОНЕЦ БЛОКА ПРИМЕРОВ**"
        return few_shot_prompt + example_text

    async def extract_data(self, letter_text: str) -> Optional[Dict[str, Any]]:
        """Извлекает структурированные данные из письма."""
        example_block = self._load_examples()
        user_prompt = f"Извлеки данные из письма:\n{letter_text}"

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": f"{example_block}\n{user_prompt}"},
            ],
            "temperature": 0.2,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                return json.loads(content)
            except Exception as e:
                print(f"Ошибка извлечения данных: {e}")
                return None

    async def ask_rag(self, query: str, message_id: str = "unknown") -> str:
        """
        Главная логика ответа:
        1. Проверяем историю (есть ли похожее письмо?). Если да -> возвращаем готовый ответ.
        2. Если нет -> делаем RAG поиск по инструкциям -> генерируем ответ через LLM -> сохраняем в историю.
        """

        existing_answer = find_similar_letter(self.history_db, query)
        if existing_answer:
            return f"[Ответ из истории похожих писем]\n\n{existing_answer}"

        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 256,
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                rewritten_query = data["choices"][0]["message"]["content"].strip()

                if not rewritten_query:
                    return user_query
                return rewritten_query

            except Exception as e:
                print(f"Ошибка при перефразировании запроса: {e}. Используем оригинал.")
                return user_query

    async def ask_rag(self, query: str, top_k: int = 3) -> str:

        optimized_query = await self.rewrite_query_for_rag(query)

        results = self._vector_db.similarity_search(optimized_query, k=top_k)

        if not results:
            results = self._vector_db.similarity_search(query, k=top_k)

        print("Найдено документов:", len(results))

        if not results:
            return "Информация по вашему запросу не найдена в инструкциях."

        context_text = ""
        sources = set()
        if results:
            for i, doc in enumerate(results):
                context_text += f"[Источник: {doc.metadata.get('source', 'Unknown')}]\n{doc.page_content}\n\n"
                sources.add(doc.metadata.get("source", "Unknown"))

        if not context_text:
            return "Информация по вашему запросу не найдена ни в истории, ни в инструкциях."

        system_prompt = (
            "Ты - технический помощник. Твоя задача отвечать на вопросы ТОЛЬКО на основе предоставленного контекста из инструкций.\n"
            "Не выдумывай факты. Ссылайся на название прибора, если оно известно из контекста. Не рассуждай, не пиши ничего лишнего."
        )

        user_prompt = f"""Контекст из инструкций:
        {context_text}
        
        Вопрос пользователя: {query}

        Ответ:"""

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.3,
            "max_tokens": 256,
        }
        url = f"{self.base_url}/chat/completions"

        async with httpx.AsyncClient(timeout=httpx.Timeout(self.timeout)) as client:
            try:
                resp = await client.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"Bearer {LLM_API_KEY}"},
                )
                resp.raise_for_status()
                generated_answer = resp.json()["choices"][0]["message"]["content"]

                final_answer = (
                    f"{generated_answer}\n\nИспользованные файлы: {', '.join(sources)}"
                )

                save_letter_to_history(self.history_db, query, final_answer, message_id)

                return final_answer

            except Exception as e:
                return f"Ошибка при обращении к нейросети: {e}"
