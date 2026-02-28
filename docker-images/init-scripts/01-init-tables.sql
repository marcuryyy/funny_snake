CREATE TABLE IF NOT EXISTS requests (
  request_id        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  req_date          TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name         TEXT NOT NULL,
  object_name       TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT NOT NULL,
  factory_number    TEXT NOT NULL,
  device_type       TEXT NOT NULL,
  emotion           TEXT NOT NULL,
  question_summary  TEXT NOT NULL,
  message_id        TEXT NOT NULL
);