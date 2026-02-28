from contextlib import asynccontextmanager
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Union
from mail_fetch import fetch_emails
import asyncpg
import os
import uvicorn
from pydantic_models import (
    AddNewRow,
    RequestCreate,
    RequestResponse,
    FetchedMailsResponse,
)

POSTGRES_DB_NAME = os.getenv("POSTGRES_DB", "postgres")
POSTGRES_DB_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_DB_PASS = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOSTNAME = os.getenv("POSTGRES_HOSTNAME", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")


def date_to_str(
    date_obj: Optional[Union[datetime.date, datetime.datetime, str]],
) -> str:
    """
    Конвертирует объект даты в строку формата 'YYYY-MM-DD'.

    Args:
        date_obj: Объект date, datetime или строка.

    Returns:
        Строка в формате 'YYYY-MM-DD'. Если вход None или пустой, возвращает текущую дату.
    """
    if date_obj is None or date_obj == "":
        return datetime.date.today().isoformat()

    if isinstance(date_obj, str):
        return date_obj

    if isinstance(date_obj, (datetime.date, datetime.datetime)):
        return date_obj.strftime("%Y-%m-%d")

    return str(date_obj)


def parse_date_string(date_str: str) -> datetime.date:
    """Парсит строку даты в объект datetime.date."""
    if not date_str:
        return datetime.date.today()

    date_str = str(date_str).strip()

    formats = [
        "%d.%m.%Y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%d.%m.%y",
    ]

    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    return datetime.date.today()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        pool = await asyncpg.create_pool(
            user=POSTGRES_DB_USER,
            password=POSTGRES_DB_PASS,
            database=POSTGRES_DB_NAME,
            host=POSTGRES_HOSTNAME,
            port=POSTGRES_PORT,
            min_size=2,
            max_size=10,
        )
        app.state.db_pool = pool

    except Exception as e:
        raise e

    yield

    await app.state.db_pool.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/requests", response_model=List[RequestResponse])
async def get_requests():
    db_pool = app.state.db_pool
    if not db_pool:
        raise HTTPException(status_code=503, detail="DB not ready")

    async with db_pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM requests ORDER BY request_id ASC")

        result = []
        for row in rows:
            result.append(
                RequestResponse(
                    id=row["request_id"],
                    date=date_to_str(row["req_date"]),
                    fullName=row["full_name"],
                    object=row["object_name"],
                    phone=row["phone"] or "",
                    email=row["email"] or "",
                    serialNumbers=row["serial_numbers"] or "",
                    deviceType=row["device_type"] or "",
                    emotion=row["emotion"],
                    issue=row["question_summary"],
                )
            )
        return result


@app.post("/api/requests", response_model=AddNewRow)
async def create_request(request_data: RequestCreate):
    db_pool = app.state.db_pool
    if not db_pool:
        raise HTTPException(status_code=503, detail="DB not ready")

    raw_date = request_data.date
    parsed_date = parse_date_string(raw_date)

    async with db_pool.acquire() as conn:
        query = """
            INSERT INTO requests 
            (req_date, full_name, object_name, phone, email, serial_numbers, device_type, emotion, question_summary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING request_id, req_date, full_name, object_name, phone, email, serial_numbers, device_type, emotion, question_summary
        """
        row = await conn.fetchrow(
            query,
            parsed_date,
            request_data.fullName,
            request_data.object,
            request_data.phone,
            request_data.email,
            request_data.serialNumbers,
            request_data.deviceType,
            request_data.emotion,
            request_data.issue,
        )

        return AddNewRow(id=row["request_id"])


@app.get("/api/fetchMails", response_model=List[FetchedMailsResponse])
async def get_mails():
    msgs = fetch_emails(limit=10, save_attachments_dir="attachments")
    return msgs


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
