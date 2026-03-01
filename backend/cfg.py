import os


PDF_FOLDER = "./instructions_pdf"
PERSIST_DIRECTORY = "./chroma_db"
EMBEDDING_MODEL = "DeepPavlov/rubert-base-cased-sentence"
LLM_BASE_URL = "http://localhost:1234/v1"
LLM_MODEL = "qwen"
LLM_API_KEY = "lm-studio"
PERSIST_DIRECTORY = os.getenv("PERSIST_DIRECTORY", "./chroma_db_rag")
PERSIST_DIRECTORY_HISTORY = os.getenv(
    "PERSIST_DIRECTORY_HISTORY", "./chroma_db_history"
)
SIMILARITY_THRESHOLD = 0.98
