from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date
from typing import Optional
import asyncpg
import os
import asyncio

POSTGRES_DB_NAME = os.getenv("POSTGRES_DB", None)
POSTGRES_DB_USER = os.getenv("POSTGRES_USER", None)
POSTGRES_DB_PASS = os.getenv("POSTGRES_PASSWORD", None)
POSTGRES_HOSTNAME = os.getenv("POSTGRES_HOSTNAME", None)
POSTGRES_PORT = os.getenv("POSTGRES_PORT", None)


class RequestBase(BaseModel):
    date: date
    fullName: str
    object: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    serialNumbers: Optional[str] = ""
    deviceType: Optional[str] = ""
    emotion: str
    issue: str

class RequestCreate(RequestBase):
    pass

class RequestResponse(RequestBase):
    id: int

app = FastAPI()
async def main():
    
    pool = await asyncpg.create_pool(
                user=POSTGRES_DB_USER,
                password=POSTGRES_DB_PASS,
                database=POSTGRES_DB_NAME,
                host=POSTGRES_HOSTNAME,
                port=POSTGRES_PORT,
            )
    app.state.db_pool=pool
    config = uvicorn.Config(app, host="0.0.0.0", port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/requests", response_model=list[RequestResponse])
async def get_requests(client:Request):
    """Выгрузка всех данных из БД"""
    db_pool = client.app.state.db_pool
    async with db_pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM requests ORDER BY request_id ASC')
        
        return [
            RequestResponse(
                id=row['request_id'],
                date=row['req_date'],
                fullName=row['full_name'],
                object=row['object_name'],
                phone=row['phone'],
                email=row['email'],
                serialNumbers=row['serial_numbers'],
                deviceType=row['device_type'],
                emotion=row['emotion'],
                issue=row['question_summary']
            ) for row in rows
        ]

@app.post("/api/requests", response_model=RequestResponse)
async def create_request(client:Request, request: RequestCreate):
    """Добавление новой записи в БД"""
    db_pool = client.app.state.db_pool
    async with db_pool.acquire() as conn:
        query = '''
            INSERT INTO requests 
            (req_date, full_name, object_name, phone, email, serial_numbers, device_type, emotion, question_summary)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING request_id
        '''
        row_id = await conn.fetchval(
            query,
            request.date, request.fullName, request.object, request.phone,
            request.email, request.serialNumbers, request.deviceType,
            request.emotion, request.issue
        )
        
        return RequestResponse(id=row_id, **request.model_dump())
    
if __name__ == "__main__":
    import uvicorn
    asyncio.run(main())