import json
import httpx
import asyncio
from typing import Optional, Dict, Any


class LLMPipeline:
    def __init__(
        self,
        base_url: str = "http://localhost:1234/v1",
        api_key: str = "lm-studio",
        model: str = "qwen",
        timeout: float = 120.0,
        examples_path: str = "./examples.json"
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.model = model
        self.timeout = httpx.Timeout(timeout)
        self.examples_path = examples_path
        self.system_prompt = (
            "Ты - мастер в извлечении данных из писем. "
            "Ты отвечаешь ТОЛЬКО JSON словарем, без MARKDOWN, комментариев и других вещей."
        )

    def _load_examples(self) -> str:
        """Формирует промпт с примерами (few-shot)."""
        with open(self.examples_path, encoding="utf-8") as f:
            examples: list[dict] = json.load(f)

        few_shot_prompt = (
            "Изучи данные примеры. Они помогут тебе правильно извлечь информацию "
            "из поступающих писем. Если информации для поля нет, оставь пустую строку:\n"
        )
        example_text = ""
        
        for idx, example in enumerate(examples):
            full_text = example.pop("full_letter_text")

            example_text += f"Пример {idx + 1}:\n{full_text}\n\n"

            expected_json_str = json.dumps(example, ensure_ascii=False, indent=2)
            example_text += f"Ожидаемый json:\n{expected_json_str}\n"
            example_text += (
                "Обрати внимание на название полей. Они должны быть точно такими же. "
                "Если информации для поля нет, оставь пустую строку.\n\n"
            )

        return few_shot_prompt + example_text

    async def extract_data(self, letter_text: str) -> Optional[Dict[str, Any]]:
        """
        Отправляет письмо модели и возвращает распарсенный JSON словарь.
        
        Args:
            letter_text: Текст письма для обработки.
            
        Returns:
            Словарь с извлеченными данными или None в случае ошибки.
        """
        example_block = self._load_examples()
        user_prompt = f"Извлеки данные из письма:\n{letter_text}"
        
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
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
