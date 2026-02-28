from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List, Union, Dict


class FetchedMailsResponse(BaseModel):
    subject: str
    text: str
    files: Optional[Union[List[str], List[Dict]]]

class EmailRequest(BaseModel):
    to_emails: List[str] = Field(..., min_items=1, max_items=50)
    subject: str = Field(..., max_length=200)
    body: str = Field(..., min_length=1, max_length=5000)
    html_body: Optional[str] = Field(None, max_length=10000)
    from_email: Optional[str] = Field(None)

class RequestBase(BaseModel):
    date: str
    fullName: str
    object: str
    phone: Optional[str] = ""
    email: Optional[str] = ""
    factoryNumber: Optional[str] = ""
    deviceType: Optional[str] = ""
    emotion: str
    issue: str


class RequestCreate(RequestBase):
    pass


class RequestResponse(RequestBase):
    id: int


class AddNewRow(BaseModel):
    id: int
