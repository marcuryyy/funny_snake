import asyncio
import datetime
import os
from pydantic_models import RequestCreate
import httpx
from typing import Optional, Dict, Any
from mail_fetch import fetch_emails
from model_requester import LLMPipeline
from dotenv import load_dotenv

load_dotenv()

IMAP_SERVER = "imap.mail.ru"
EMAIL_USER = os.getenv("IMAP_EMAIL", "")
EMAIL_PASS = os.getenv("EXTERNAL_PASS", "")
API_BASE_URL = "http://localhost:8000"
API_ENDPOINT = "/api/requests"


async def process_letter(letter_text: str, message_id: str):

    llm = LLMPipeline()

    extracted_data = await llm.extract_data(letter_text)
    llm_answer = await llm.ask_rag(letter_text)
    if not extracted_data:
        return

    request_payload = RequestCreate(
        date=extracted_data.get("date", ""),
        fullName=extracted_data.get("full_name", ""),
        object=extracted_data.get("object", ""),
        phone=extracted_data.get("phone", ""),
        email=extracted_data.get("email", ""),
        factoryNumber=extracted_data.get("factory_number", ""),
        deviceType=extracted_data.get("device_type", ""),
        emotion=extracted_data.get("emotional_tone", ""),
        issue=extracted_data.get("issue_summary"),
        llm_answer=llm_answer,
        message_id=message_id,
    )

    async with httpx.AsyncClient() as api_client:
        try:
            response = await api_client.post(
                f"{API_BASE_URL}{API_ENDPOINT}",
                json=request_payload.model_dump(),
                headers={"Content-Type": "application/json"},
            )

            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                return result
            else:
                print(f"Текст ошибки: {response.text}")

        except httpx.ConnectError:
            print(
                f"Не удалось подключиться к API по адресу {API_BASE_URL}. Убедитесь, что сервер запущен."
            )
        except Exception as e:
            print(f"Произошла ошибка при запросе к API: {e}")


if __name__ == "__main__":
    msgs = fetch_emails(1, "output")
    letter_text = ""
    for msg in msgs:
        letter_text += f"Почта: {msg['sender_email']}\n"
        letter_text += f"Дата: {msg['date']}\n"
        letter_text += msg["text"]
        message_id = msg["message_id"]

        asyncio.run(process_letter(letter_text, message_id))
