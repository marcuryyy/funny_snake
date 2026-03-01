from datetime import date, datetime
from typing import Optional, Union


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
        "%a, %d %b %Y %H:%M:%S %z",
        "%a, %d %b %Y %H:%M:%S",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue

    try:
        import email.utils

        dt = email.utils.parsedate_to_datetime(date_str)
        return dt.date()
    except:
        pass

    return date.today()


def date_to_str(date_obj: Optional[Union[date, datetime, str]]) -> str:
    if date_obj is None or date_obj == "":
        return date.today().isoformat()
    if isinstance(date_obj, str):
        return date_obj
    if isinstance(date_obj, (date, datetime)):
        return date_obj.strftime("%Y-%m-%d")
    return str(date_obj)
