import mimetypes
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.header import Header
from typing import List, Optional, Tuple
import os
from dotenv import load_dotenv

import aiosmtplib

load_dotenv()

SMTP_SERVER = "smtp.mail.ru"
SMTP_USER = os.getenv("SMTP_EMAIL", "")
SMTP_PASS = os.getenv("EXTERNAL_PASS", "")

async def send_email(
    to_emails: List[str],
    subject: str,
    body: str,
    from_email: Optional[str] = None,
    html_body: Optional[str] = None,
    message_id: Optional[str] = None,
    reply_to_thread: bool = False
) -> bool:
    from_email = from_email or SMTP_USER

    try:
        msg = MIMEMultipart("mixed")
        msg['Subject'] = Header(subject, 'utf-8')
        msg['From'] = from_email 
        msg['To'] = ", ".join(to_emails)

        if reply_to_thread and message_id:
            msg['In-Reply-To'] = message_id
            msg['References'] = message_id

        if html_body:
            msg_alt = MIMEMultipart('alternative')
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            msg_alt.attach(MIMEText(body, 'plain', 'utf-8'))
            msg_alt.attach(MIMEText(html_body, 'html', 'utf-8'))
            msg.attach(msg_alt)
        else:
            msg.attach(MIMEText(body, 'plain', 'utf-8'))

        smtp_config = {
            "hostname": SMTP_SERVER,
            "port": 465,
            "use_tls": True,
            "timeout": 30,
            "validate_certs": True
        }

        async with aiosmtplib.SMTP(**smtp_config) as server:
            await server.login(SMTP_USER, SMTP_PASS)
            await server.send_message(msg)

        print(f"Email отправлен на {len(to_emails)} адресов")
        return True

    except Exception as e:
        print(f"Ошибка отправки: {str(e)}")
        return False



if __name__ == "__main__":
    import asyncio
    
    async def test_email():
        success = await send_email(
            to_emails=["my_test@mail.ru"], 
            subject="Тестовое письмо",
            body="Это автоматическое тестовое письмо.",
            html_body="""
            <html>
                <body>
                    <h2>Тест прошел успешно! ✅</h2>
                </body>
            </html>
            """
        )
        
        if success:
            print("Тест отправки прошел успешно!")
        else:
            print("Тест отправки провалился")
    
    asyncio.run(test_email())
