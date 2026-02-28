import imaplib
import email
from email.header import decode_header
from bs4 import BeautifulSoup
import os
from dotenv import load_dotenv

load_dotenv()

IMAP_SERVER = "imap.mail.ru"
EMAIL_USER = os.getenv("IMAP_EMAIL", "")
EMAIL_PASS = os.getenv("EXTERNAL_PASS", "")


def decode_str(s):
    if not s:
        return ""
    dh = decode_header(s)
    parts = []
    for text, enc in dh:
        if isinstance(text, bytes):
            parts.append(text.decode(enc or "utf-8", errors="ignore"))
        else:
            parts.append(text)
    return "".join(parts)


def get_body(msg):
    if msg.is_multipart():
        text_parts = []
        html_parts = []
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = part.get("Content-Disposition", "")
            if "attachment" in (disp or "").lower():
                continue
            if ctype == "text/plain":
                text_parts.append(
                    part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8",
                        errors="ignore",
                    )
                )
            elif ctype == "text/html":
                html_parts.append(
                    part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8",
                        errors="ignore",
                    )
                )
            print(ctype)

        if text_parts:
            return "\n".join(text_parts).strip()
        if html_parts:
            soup = BeautifulSoup("\n".join(html_parts), "html.parser")
            return soup.get_text("\n").strip()
        return ""
    else:
        print("Message is not multipart")
        payload = msg.get_payload(decode=True)
        if not payload:
            return ""

        charset = msg.get_content_charset() or "utf-8"
        content = payload.decode(charset, errors="ignore").strip()
        ctype = msg.get_content_type()
        if ctype == "text/html":
            soup = BeautifulSoup(content, "html.parser")
            return soup.get_text("\n").strip()
        elif ctype == "text/plain":
            return content
        else:
            return content


def get_attachments(msg, save_dir=None):
    files = []
    for part in msg.walk():
        disp = part.get("Content-Disposition", "")
        if disp and "attachment" in disp.lower():
            filename = part.get_filename()
            filename = decode_str(filename)
            data = part.get_payload(decode=True)
            if save_dir and filename:
                import os

                path = os.path.join(save_dir, filename)
                with open(path, "wb") as f:
                    f.write(data)
                files.append(path)
            else:
                files.append({"filename": filename, "data": data})
    return files


def fetch_emails(limit=None, save_attachments_dir=None):
    mail = imaplib.IMAP4_SSL(IMAP_SERVER)
    mail.login(EMAIL_USER, EMAIL_PASS)
    print("success")
    mail.select("INBOX")

    status, data = mail.search(None, "UNSEEN")
    if status != "OK":
        mail.logout()
        return []

    ids = data[0].split()
    if limit:
        ids = ids[-limit:]

    emails = []
    for msg_id in ids:
        status, msg_data = mail.fetch(msg_id, "(RFC822)")
        if status != "OK":
            continue

        raw = msg_data[0][1]
        msg = email.message_from_bytes(raw)

        subject = decode_str(msg.get("Subject"))
        body = get_body(msg)
        message_id = decode_str(msg.get("Message-ID", ""))
        os.makedirs(save_attachments_dir, exist_ok=True)
        attachments = get_attachments(msg, save_dir=save_attachments_dir)
        print(subject, message_id)
        emails.append(
            {
                "subject": subject,
                "text": body,
                "message_id": message_id,
                "files": attachments,
            }
        )

    mail.close()
    mail.logout()
    return emails


if __name__ == "__main__":
    msgs = fetch_emails(limit=10, save_attachments_dir="attachments")
    print(msgs)
    for m in msgs:
        print("Subject:", m["subject"])
        print("Text:", m["text"][:200], "...\n")
        print("Files:", m["files"])
        print("-" * 80)
