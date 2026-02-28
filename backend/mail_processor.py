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
EMAIL_USER = os.getenv("IMAP_EMAIL", "enigma_hack@mail.ru")
EMAIL_PASS = os.getenv("EXTERNAL_PASS", "rgPRLpzseUkkV9zSvsbj")
API_BASE_URL = "http://localhost:8000"  
API_ENDPOINT = "/api/requests"


async def process_letter_and_send_to_api(letter_text: str):
    
    llm = LLMPipeline()
    
    extracted_data = await llm.extract_data(letter_text)
    
    if not extracted_data:
        return

    request_payload = RequestCreate(
            date=extracted_data.get("date", extracted_data.get("date", "")),
            fullName=extracted_data.get("ФИО", extracted_data.get("full_name", "")),
            object=extracted_data.get("Объект", extracted_data.get("object_name", "")),
            phone=extracted_data.get("Телефон", extracted_data.get("phone", "")),
            email=extracted_data.get("Email", extracted_data.get("email", "")),
            serialNumbers=extracted_data.get("Серийный номер", extracted_data.get("serial_number", "")),
            deviceType=extracted_data.get("Тип устройства", extracted_data.get("device_type", "")),
            emotion=extracted_data.get("Эмоция", extracted_data.get("emotion", "neutral")),
            issue=extracted_data.get("Вопрос", extracted_data.get("issue_summary", ""))
        )
    
    async with httpx.AsyncClient() as api_client:
        try:
            response = await api_client.post(
                f"{API_BASE_URL}{API_ENDPOINT}",
                json=request_payload.model_dump(),
                headers={"Content-Type": "application/json"}
            )
            
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                print(f"{result}")
                return result
            else:
                print(f"Текст ошибки: {response.text}")
                
        except httpx.ConnectError:
            print(f"Не удалось подключиться к API по адресу {API_BASE_URL}. Убедитесь, что сервер запущен.")
        except Exception as e:
            print(f"Произошла ошибка при запросе к API: {e}")


if __name__ == "__main__":
    msgs = fetch_emails(1, "output")
 #   print(msgs)
    letter_text = msgs[0]['text']
    test_letter = """
    Дата: 28.02.2026
    От: Иванов Петр Сидорович
    Организация: ООО "СеверСталь"
    Телефон: +7 (999) 123-45-67
    Email: p.ivanov@severstal.com
    
    Добрый день!
    
    У нас проблема с устройством типа ДГС-200 (серийный номер SN-998877). 
    Оно перегревается и гудит. Требуется срочная консультация.
    Эмоциональное состояние: тревога.
    
    С уважением, Петр.
    """

    asyncio.run(process_letter_and_send_to_api(letter_text))