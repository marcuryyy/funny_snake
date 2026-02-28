CREATE TYPE task_statuses as ENUM ('OPEN', 'IN PROGRESS', 'CLOSED');

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
  llm_answer        TEXT NOT NULL,
  task_status       task_statuses DEFAULT 'OPEN'
  message_id        TEXT NOT NULL
);