import os
import glob
import logging
from typing import List, Optional


logging.getLogger("sentence_transformers").setLevel(logging.WARNING)
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

from cfg import EMBEDDING_MODEL, PERSIST_DIRECTORY, PDF_FOLDER


logger = logging.getLogger(__name__)


embeddings = HuggingFaceEmbeddings(
    model_name=EMBEDDING_MODEL,
    model_kwargs={"device": "cpu"},
    encode_kwargs={"normalize_embeddings": True},
)


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=2000, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""]
)


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

    if os.path.exists(PERSIST_DIRECTORY) and os.path.isdir(PERSIST_DIRECTORY):
        vectorstore = Chroma(
            persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
        )

        count = vectorstore._collection.count()
        logger.info(f"Индекс загружен. Количество чанков: {count}")
        return vectorstore

    else:
        docs = load_and_split_pdfs(PDF_FOLDER)

        if not docs:
            raise ValueError()

        vectorstore = Chroma.from_documents(
            documents=docs, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
        )

        return vectorstore


def create_vector_store(documents: List[Document]) -> Chroma:

    vectordb = Chroma.from_documents(
        documents=documents, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
    )
    return vectordb
