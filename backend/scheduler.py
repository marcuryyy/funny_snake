import os
import logging
import signal
import sys
import time
from datetime import datetime
from threading import Event

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

import asyncio
from mail_fetch import fetch_emails
from model_requester import LLMPipeline
from pydantic_models import RequestCreate
from utils import parse_date_string
import httpx

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
ATTACHMENTS_DIR = os.getenv("ATTACHMENTS_DIR", "attachments")
CHECK_INTERVAL_MINUTES = int(os.getenv("CHECK_INTERVAL_MINUTES", "1"))

shutdown_event = Event()
logger = logging.getLogger("Scheduler")


def process_single_letter(msg: dict):
    message_id = msg.get("message_id", "")
    if not message_id:
        logger.warning("Письмо без ID, пропускаем.")
        return

    try:
        letter_text = f"От: {msg.get('sender_email', 'Unknown')}\n"
        letter_text += f"Тема: {msg.get('subject', '')}\n"
        letter_text += f"Дата: {msg.get('date', '')}\n\n"
        letter_text += msg.get("text", "")

        llm = LLMPipeline()

        extracted_data = asyncio.run(llm.extract_data(letter_text))
        if not extracted_data:
            logger.warning(f"Не удалось извлечь данные для {message_id}")
            return

        llm_answer = asyncio.run(llm.ask_rag(letter_text, message_id=message_id))

        payload = RequestCreate(
            date=extracted_data.get("date", ""),
            fullName=extracted_data.get("full_name", ""),
            object=extracted_data.get("object", ""),
            phone=extracted_data.get("phone", ""),
            email=extracted_data.get("email", ""),
            factoryNumber=extracted_data.get("factory_number", ""),
            deviceType=extracted_data.get("device_type", ""),
            emotion=extracted_data.get("emotional_tone", ""),
            issue=extracted_data.get("issue_summary", ""),
            llm_answer=llm_answer or "",
            message_id=message_id,
            task_status="OPEN",
        )

        with httpx.Client(timeout=120.0) as client:
            url = f"{API_BASE_URL}/api/requests"
            response = client.post(url, json=payload.model_dump())

            if response.status_code in [200, 201, 409]:
                logger.info(f"Письмо {message_id} успешно обработано и сохранено.")
            else:
                logger.error(f"Ошибка API: {response.status_code} - {response.text}")

    except Exception as e:
        logger.error(f"Критическая ошибка обработки {message_id}: {e}", exc_info=True)


def mail_fetch_job():
    if shutdown_event.is_set():
        return
    logger.info("--- Запуск проверки почты ---")
    try:
        msgs = fetch_emails(limit=10, save_attachments_dir=ATTACHMENTS_DIR)
        if not msgs:
            logger.info("Новых писем нет.")
            return

        for msg in msgs:
            if shutdown_event.is_set():
                break
            process_single_letter(msg)
    except Exception as e:
        logger.error(f"Ошибка в задаче: {e}", exc_info=True)


def main():
    scheduler = BlockingScheduler()
    scheduler.add_job(
        mail_fetch_job,
        trigger=IntervalTrigger(minutes=CHECK_INTERVAL_MINUTES),
        id="mail_fetch_job",
        replace_existing=True,
        misfire_grace_time=60,
    )

    def handle_signal(sig, frame):
        shutdown_event.set()
        scheduler.shutdown(wait=False)
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        pass
    finally:
        print("Scheduler stopped")


if __name__ == "__main__":
    main()
