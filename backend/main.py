from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import date, datetime
import csv
import io
from typing import Optional, List, Union
from mail_fetch import fetch_emails
import asyncpg
import asyncio
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
    date_obj: Optional[Union[date, datetime, str]],
) -> str:
    """
    Конвертирует объект даты в строку формата 'YYYY-MM-DD'.

    Args:
        date_obj: Объект date, datetime или строка.

    Returns:
        Строка в формате 'YYYY-MM-DD'. Если вход None или пустой, возвращает текущую дату.
    """
    if date_obj is None or date_obj == "":
        return date.today().isoformat()

    if isinstance(date_obj, str):
        return date_obj

    if isinstance(date_obj, (date, datetime)):
        return date_obj.strftime("%Y-%m-%d")

    return str(date_obj)


def parse_date_string(date_str: str) -> date:
    """Парсит строку даты в объект date."""
    if not date_str:
        return date.today()

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
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    return date.today()


async def get_filtered_requests(
    db_pool,
    full_name: Optional[str],
    object_name: Optional[str],
    phone: Optional[str],
    email: Optional[str],
    emotion: Optional[str],
    issue: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> List[RequestResponse]:
    """Возвращает отфильтрованные запросы из БД"""
    if not db_pool:
        raise HTTPException(status_code=503, detail="DB not ready")

    parsed_date_from = parse_date_string(date_from) if date_from else None
    parsed_date_to = parse_date_string(date_to) if date_to else None

    params = [
        f"%{full_name}%" if full_name else None,
        f"%{object_name}%" if object_name else None,
        phone,
        f"%{email}%" if email else None,
        emotion,
        f"%{issue}%" if issue else None,
        parsed_date_from,
        parsed_date_to,
    ]

    async with db_pool.acquire() as conn:
        base_query = """
            SELECT * FROM requests 
            WHERE ($1::text IS NULL OR LOWER(full_name) LIKE LOWER($1))
              AND ($2::text IS NULL OR LOWER(object_name) LIKE LOWER($2))
              AND ($3::text IS NULL OR phone ILIKE $3)
              AND ($4::text IS NULL OR LOWER(email) LIKE LOWER($4))
              AND ($5::text IS NULL OR emotion = $5)
              AND ($6::text IS NULL OR LOWER(question_summary) LIKE LOWER($6))
              AND ($7::date IS NULL OR req_date >= $7)
              AND ($8::date IS NULL OR req_date <= $8)
        """

        if limit is not None and offset is not None:
            base_query += " ORDER BY request_id ASC LIMIT $9 OFFSET $10"
            params.extend([limit, offset])
        else:
            base_query += " ORDER BY request_id ASC"
        rows = await conn.fetch(base_query, *params)

        result = []
        for row in rows:
            result.append(
                RequestResponse(
                    id=row["request_id"],
                    date=date_to_str(row["req_date"]),
                    fullName=row["full_name"] or "",
                    object=row["object_name"] or "",
                    phone=row["phone"] or "",
                    email=row["email"] or "",
                    factoryNumber=row["factory_number"] or "",
                    deviceType=row["device_type"] or "",
                    emotion=row["emotion"],
                    issue=row["question_summary"] or "",
                )
            )
        return result


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
async def get_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    full_name: Optional[str] = Query(None),
    object_name: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    emotion: Optional[str] = Query(None),
    issue: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Получить список запросов с фильтрами и пагинацией"""
    offset = (page - 1) * limit

    result = await get_filtered_requests(
        db_pool=app.state.db_pool,
        full_name=full_name,
        object_name=object_name,
        phone=phone,
        email=email,
        emotion=emotion,
        issue=issue,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
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
            (req_date, full_name, object_name, phone, email, factory_number, device_type, emotion, question_summary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING request_id, req_date, full_name, object_name, phone, email, factory_number, device_type, emotion, question_summary
        """
        row = await conn.fetchrow(
            query,
            parsed_date,
            request_data.fullName,
            request_data.object,
            request_data.phone,
            request_data.email,
            request_data.factoryNumber,
            request_data.deviceType,
            request_data.emotion,
            request_data.issue,
        )

        return AddNewRow(id=row["request_id"])


@app.get("/api/fetchMails", response_model=List[FetchedMailsResponse])
async def get_mails():
    msgs = fetch_emails(limit=10, save_attachments_dir="attachments")
    return msgs


@app.get("/api/getCsv")
async def get_table_csv(
    full_name: Optional[str] = Query(None),
    object_name: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    emotion: Optional[str] = Query(None),
    issue: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Экспорт отфильтрованных запросов в CSV"""
    db_pool = app.state.db_pool
    if not db_pool:
        raise HTTPException(status_code=503, detail="DB not ready")

    async def generate_csv():
        async with db_pool.acquire() as conn:
            headers = list(RequestResponse.model_fields.keys())

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(headers)
            yield output.getvalue()

            batch_size = 5000
            offset = 0

            while True:
                batch = await get_filtered_requests(
                    db_pool=db_pool,
                    full_name=full_name,
                    object_name=object_name,
                    phone=phone,
                    email=email,
                    emotion=emotion,
                    issue=issue,
                    date_from=date_from,
                    date_to=date_to,
                    limit=batch_size,
                    offset=offset,
                )

                if not batch:
                    break

                csv_rows = []
                for row in batch:
                    row_dict = row.dict() if hasattr(row, "dict") else dict(row)
                    csv_row = [str(row_dict.get(h, "")) for h in headers]
                    csv_rows.append(csv_row)

                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerows(csv_rows)
                yield output.getvalue()

                output.close()

                offset += batch_size

    filename = f"requests_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        generate_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/csv; charset=utf-8-sig",
        },
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
