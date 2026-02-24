CREATE TABLE IF NOT EXISTS requests (
  request_id        INT PRIMARY KEY,
  req_date      TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name       TEXT NOT NULL,
  object_name TEXT NOT NULL,
  phone      TEXT NOT NULL,
  email  TEXT NOT NULL,
  serial_numbers        TEXT NOT NULL,
  device_type         TEXT NOT NULL,
  emotion    TEXT NOT NULL,
  question_summary    TEXT NOT NULL
);