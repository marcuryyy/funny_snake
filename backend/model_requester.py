import json
from vector_base import get_or_create_index
import httpx
import asyncio
from typing import Optional, Dict, Any
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
        self._vector_db = get_or_create_index()

    def _load_examples(self) -> str:
        """Формирует промпт с примерами (few-shot)."""
        with open(self.examples_path, encoding="utf-8") as f:
            examples: list[dict] = json.load(f)

        few_shot_prompt = (
            "**НАЧАЛО БЛОКА ПРИМЕРОВ**"
            "Изучи данные примеры. Они помогут тебе правильно извлечь информацию из поступающих писем. **НЕЛЬЗЯ** брать информацию из ПРИМЕРОВ!."
            "**emotional_tone** может быть одним из: положительное, нейтральное, негативное. Его **НУЖНО** определять всегда!"
            " Для остальных полей **КРОМЕ emotional_tone**, если нет информации, оставь пустую строку:\n"
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
        example_text += "\n **КОНЕЦ БЛОКА ПРИМЕРОВ**"
        return few_shot_prompt + example_text

    async def extract_data(self, letter_text: str) -> Optional[Dict[str, Any]]:
        """
        Отправляет письмо модели и возвращает распарсенный JSON словарь.
        """
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
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()

                content = data["choices"][0]["message"]["content"]
                content = content.strip()

                return json.loads(content)

            except httpx.ReadTimeout:
                print("Ошибка: Превышено время ожидания ответа от модели.")
                return None
            except json.JSONDecodeError as e:
                print(f"Ошибка парсинга JSON ответа: {e}")
                print(f"Полученный ответ: {data['choices'][0]['message']['content']}")
                return None
            except Exception as e:
                print(f"Произошла ошибка при запросе: {e}")
                return None

    async def rewrite_query_for_rag(self, user_query: str) -> str:
        """
        Перефразирует пользовательский запрос в стиль технической документации,
        удаляя эмоции, личные местоимения и лишние слова для улучшения поиска в RAG.
        """
        system_prompt = (
            "Ты - ассистент для оптимизации поисковых запросов в техническую базу знаний. "
            "Твоя задача: перефразировать входной текст пользователя так, как будто это сухой технический вопрос из документации. "
            "Правила:\n"
            "1. Убери все эмоции, вежливость ('пожалуйста', 'помогите'), личные местоимения ('я', 'мы').\n"
            "2. Оставь только суть: название устройства, компонент и конкретную проблему/функцию.\n"
            "3. Используй терминологию, характерную для инструкций (например, вместо 'не работает' пиши 'принцип работы', 'настройка', 'ошибка').\n"
            "4. Верни ТОЛЬКО перефразированный запрос, без кавычек и пояснений."
        )
        
        user_prompt = f"Исходный запрос: {user_query}\nПерефразированный технический запрос:"

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
            "temperature": 0.1, # Низкая температура для точности
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
            try:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                data = response.json()
                rewritten_query = data["choices"][0]["message"]["content"].strip()
                
                # Если модель вернула что-то странное,fallback на оригинал
                if not rewritten_query:
                    return user_query
                return rewritten_query

            except Exception as e:
                print(f"Ошибка при перефразировании запроса: {e}. Используем оригинал.")
                return user_query

    async def ask_rag(self, query: str, top_k: int = 3) -> str:
        # 1. Сначала перефразируем запрос для лучшего поиска
        optimized_query = await self.rewrite_query_for_rag(query)
        print(f"🔍 Оригинальный запрос: {query}")
        print(f"🔍 Оптимизированный запрос для RAG: {optimized_query}")

        # 2. Ищем по оптимизированному запросу
        results = self._vector_db.similarity_search(optimized_query, k=top_k)
        
        if not results:
            # Если не нашли, пробуем поискать по оригинальному запросу на всякий случай
            results = self._vector_db.similarity_search(query, k=top_k)
            
        print("📄 Найдено документов:", len(results))
        
        if not results:
            return "Информация по вашему запросу не найдена в инструкциях."
            
        context_text = ""
        sources = set()
        for i, doc in enumerate(results):
            context_text += f"[Источник: {doc.metadata.get('source', 'Unknown')}]\n{doc.page_content}\n\n"
            sources.add(doc.metadata.get("source", "Unknown"))

        system_prompt = (
            "Ты - технический помощник. Твоя задача отвечать на вопросы ТОЛЬКО на основе предоставленного контекста из инструкций.\n"
            "Не выдумывай факты. Ссылайся на название прибора, если оно известно из контекста. Не рассуждай, не пиши ничего лишнего. У тебя есть предоставленный контекст, бери информацию из него."
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
                answer = resp.json()["choices"][0]["message"]["content"]

                answer += f"\n\nИспользованные файлы: {', '.join(sources)}"
                return answer

            except Exception as e:
                return f"Ошибка при обращении к нейросети: {e}"
