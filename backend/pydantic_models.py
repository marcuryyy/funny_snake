from pydantic import BaseModel
from typing import Optional, List, Union, Dict

class FetchedMailsResponse(BaseModel):
    subject: str
    text: str
    files: Optional[Union[List[str], List[Dict]]]
