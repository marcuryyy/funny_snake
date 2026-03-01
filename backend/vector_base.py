import os
import glob
import logging
from typing import List, Optional, Tuple

logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from cfg import (
    EMBEDDING_MODEL,
    PERSIST_DIRECTORY,
    PDF_FOLDER,
    PERSIST_DIRECTORY_HISTORY,
    SIMILARITY_THRESHOLD,
)

logger = logging.getLogger(__name__)


embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""]
)


def get_rag_index() -> Chroma:
    if os.path.exists(PERSIST_DIRECTORY) and os.path.isdir(PERSIST_DIRECTORY):
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
        )
        count = vectorstore._collection.count()
        logger.info(f"RAG индекс загружен. Чанков: {count}")
        return vectorstore
    else:
        docs = load_and_split_pdfs(PDF_FOLDER)
        if not docs:
            return Chroma(
                persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
            )

        vectorstore = Chroma.from_documents(
            documents=docs, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
        )
        logger.info("RAG индекс создан.")
        return vectorstore


def get_history_index() -> Chroma:
    if os.path.exists(PERSIST_DIRECTORY_HISTORY) and os.path.isdir(
        PERSIST_DIRECTORY_HISTORY
    ):
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY_HISTORY, embedding_function=embeddings
        )
        count = vectorstore._collection.count()
        logger.info(f"History индекс загружен. Записей: {count}")
        return vectorstore
    else:
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY_HISTORY, embedding_function=embeddings
        )
        logger.info("History индекс создан.")
        return vectorstore


def find_similar_letter(db: Chroma, text: str) -> Optional[str]:
    results = db.similarity_search_with_score(text, k=1)

    if not results:
        return None

    doc, score = results[0]

    similarity = 1 - (score**2) / 2

    logger.debug(f"схожесть={similarity:.4f}, порог={SIMILARITY_THRESHOLD}")

    if similarity >= SIMILARITY_THRESHOLD:
        answer = doc.metadata.get("llm_answer")
        if answer:
            return answer

    return None


def save_letter_to_history(db: Chroma, question: str, answer: str, message_id: str):
    doc = Document(
        page_content=question,
        metadata={
            "llm_answer": answer,
            "message_id": message_id,
            "type": "letter_history",
        },
    )
    db.add_documents([doc])


def load_and_split_pdfs(folder_path: str) -> List[Document]:
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"Нет PDF файлов в папке {folder_path}")
    all_docs = []
    for file_path in pdf_files:
        try:
            loader = PyMuPDFLoader(file_path)
            docs = loader.load()
            for doc in docs:
                doc.metadata["source"] = os.path.basename(file_path)
            all_docs.extend(docs)
        except Exception as e:
            logger.error(f"Ошибка чтения {file_path}: {e}")
    return text_splitter.split_documents(all_docs)


def get_or_create_index() -> Chroma:

    return get_rag_index()


def create_vector_store(documents: List[Document]) -> Chroma:
    return Chroma.from_documents(
        documents=documents, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
    )
