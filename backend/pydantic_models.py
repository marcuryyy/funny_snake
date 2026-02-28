from pydantic import BaseModel
from datetime import date
from typing import Optional, List

class RequestBase(BaseModel):
    date: str
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