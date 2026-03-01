import os
from vector_base import get_history_index, embeddings
from langchain_core.documents import Document
from cfg import PERSIST_DIRECTORY_HISTORY


SEED_DATA = [
    {
        "question": "Здравствуйте, я не понимаю, как работает ЭРИС-130. Подскажите, пожалуйста",
        "answer": "Добрый день! Он работает очень просто, вот подробная инструкция, ознакомьтесь с ней:...",
        "message_id": "manual_seed_001",
    },
    {
        "question": "Как сбросить настройки до заводских на устройстве Вектор-М?",
        "answer": "Для сброса настроек на устройстве Вектор-М выполните следующие действия:\n1. Выключите прибор.\n2. Зажмите одновременно кнопки 'МЕНЮ' и 'ВНИЗ'.\n3. Не отпуская кнопки, включите прибор.\n4. Держите кнопки до появления надписи 'Factory Reset' на экране.\n\nВнимание! Все пользовательские данные будут удалены.",
        "message_id": "manual_seed_002",
    },
    {
        "question": "Ошибка Е05 на дисплее термостата, расшифруйте пожалуйста.",
        "answer": "Ошибка Е05 на термостате означает 'Неисправность датчика температуры' или 'Обрыв цепи датчика'.\n\nЧто нужно сделать:\n1. Проверьте плотность подключения разъема датчика к плате прибора.\n2. Осмотрите провод датчика на предмет повреждений.\n3. Если визуальный осмотр не помог, требуется замена датчика температуры.\n\nПодробнее см. в инструкции, глава 'Коды ошибок'.",
        "message_id": "manual_seed_003",
    },
]


def main():
    print(f"Подключение к базе истории: {PERSIST_DIRECTORY_HISTORY}...")

    db = get_history_index()

    documents_to_add = []

    for item in SEED_DATA:
        doc = Document(
            page_content=item["question"],
            metadata={
                "llm_answer": item["answer"],
                "message_id": item["message_id"],
                "type": "manual_seed",
                "source": "manual_initialization",
            },
        )
        documents_to_add.append(doc)
        print(f"Подготовлен пример: {item['message_id']}")

    if not documents_to_add:
        print("Нет данных для добавления.")
        return

    db.add_documents(documents_to_add)

    if hasattr(db, "persist"):
        db.persist()

    count = db._collection.count()
    print(f"\Всего записей в базе истории: {count}")


if __name__ == "__main__":
    main()
