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
from langchain_chroma import Chroma
from langchain_core.documents import Document
import os
from cfg import *

def load_and_split_pdfs(folder_path: str) -> List[Document]:
    pdf_files = glob.glob(os.path.join(folder_path, "*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"Нет PDF файлов в папке {folder_path}")

    all_docs = []
    for file_path in pdf_files:
        try:
            # Инициализируем класс для каждого файла
            loader = PyMuPDFLoader(file_path) 
            docs = loader.load()

            for doc in docs:
                doc.metadata["source"] = os.path.basename(file_path)
            all_docs.extend(docs)
        except Exception as e:
            print(f"Ошибка чтения {file_path}: {e}")

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000, 
        chunk_overlap=200, 
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    return text_splitter.split_documents(all_docs)

def get_or_create_index():
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    
    print("Создание нового индекса...")
    docs = load_and_split_pdfs(PDF_FOLDER)
    return Chroma.from_documents(
        documents=docs, 
        embedding=embeddings, 
        persist_directory=PERSIST_DIRECTORY
    )


def create_vector_store(documents: List[Document]):
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    vectordb = Chroma.from_documents(
        documents=documents, embedding=embeddings, persist_directory=PERSIST_DIRECTORY
    )
    return vectordb


