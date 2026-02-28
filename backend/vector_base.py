import os
import glob
import hashlib
import json
import httpx
import asyncio
from typing import List, Optional


from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
import os
from cfg import *

def load_and_split_pdfs(folder_path: str) -> List[Document]:
    """Загружает все PDF из папки и разбивает их на чанки."""
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"Нет PDF файлов в папке {folder_path}")

    print(f"file amounbt: {len(pdf_files)}")

    all_docs = []
    loader = PyMuPDFLoader

    for file_path in pdf_files:
        try:
            docs = loader(file_path).load()

            for doc in docs:
                doc.metadata["source"] = os.path.basename(file_path)

            all_docs.extend(docs)
        except Exception as e:
            print(f"Ошибка чтения {file_path}: {e}")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, chunk_overlap=200, separators=["\n\n", "\n", ". ", " ", ""]
    )

    splits = text_splitter.split_documents(all_docs)
    return splits


def create_vector_store(documents: List[Document]):
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cuda"},
        encode_kwargs={"normalize_embeddings": True},
    )

    vectordb = Chroma.from_documents(
        documents=documents, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
    )
    return vectordb


def get_or_create_index():
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

    if os.path.exists(PERSIST_DIRECTORY):
        vectordb = Chroma(
            persist_directory=PERSIST_DIRECTORY, embedding_function=embeddings
        )

    else:
        docs = load_and_split_pdfs(PDF_FOLDER)
        vectordb = create_vector_store(docs)

    return vectordb
