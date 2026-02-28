from pydantic import BaseModel
from datetime import date
from typing import Optional, List, Union, Dict


class FetchedMailsResponse(BaseModel):
    subject: str
    text: str
    files: Optional[Union[List[str], List[Dict]]]


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


class AddNewRow(BaseModel):
    id: int
