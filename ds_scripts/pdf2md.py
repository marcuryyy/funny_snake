#!/usr/bin/env python3
"""
Скрипт для конвертации PDF файлов в Markdown для использования в RAG.
Рекурсивно обрабатывает все PDF файлы в указанной папке.
"""

from pathlib import Path

try:
    import pymupdf4llm
except ImportError:
    raise ImportError(
        "Требуется библиотека pymupdf4llm. Установите: pip install pymupdf4llm"
    )


def convert_pdf_to_md(pdf_path: Path, output_dir: Path) -> Path:
    """
    Конвертирует PDF файл в Markdown.

    Args:
        pdf_path: Путь к PDF файлу.
        output_dir: Директория для сохранения MD файла.

    Returns:
        Путь к созданному MD файлу.
    """
    md_filename = pdf_path.stem + ".md"
    md_path = output_dir / md_filename

    md_text = pymupdf4llm.to_markdown(pdf_path)
    md_path.write_text(md_text, encoding="utf-8", errors="replace")

    return md_path


def process_directory(
    source_dir: Path,
    output_dir: Path,
    recursive: bool = True,
) -> list[tuple[Path, Path]]:
    """
    Обрабатывает все PDF файлы в директории.

    Args:
        source_dir: Исходная директория с PDF файлами.
        output_dir: Директория для сохранения MD файлов.
        recursive: Рекурсивно обрабатывать поддиректории.

    Returns:
        Список кортежей (путь_pdf, путь_md).
    """
    pattern = "**/*.pdf" if recursive else "*.pdf"
    pdf_files = list(source_dir.glob(pattern))

    if not pdf_files:
        print(f"PDF файлы не найдены в {source_dir}")
        return []

    print(f"Найдено PDF файлов: {len(pdf_files)}")

    results = []
    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"[{i}/{len(pdf_files)}] Обработка: {pdf_path.name}")

        try:
            md_path = convert_pdf_to_md(pdf_path, output_dir)
            results.append((pdf_path, md_path))
            print(f"  -> Создан: {md_path.name}")
        except Exception as e:
            print(f"  -> Ошибка: {e}")

    return results


def main():
    SOURCE_DIR = Path(
        r"c:\Users\Admin\Desktop\enigma\eriskip_files\Руководство по эксплуатации1"
    )
    OUTPUT_DIR = Path(r"c:\Users\Admin\Desktop\enigma\eriskip_files\md_output")

    source_dir = SOURCE_DIR.resolve()
    if not source_dir.exists():
        print(f"Ошибка: Директория не найдена: {source_dir}")
        return 1

    output_dir = OUTPUT_DIR
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"Источник: {source_dir}")
    print(f"Выходная директория: {output_dir}")
    print("-" * 50)

    results = process_directory(
        source_dir=source_dir,
        output_dir=output_dir,
        recursive=True,
    )

    print("-" * 50)
    print(
        f"Готово! Успешно сконвертировано: {len(results)} из {len(list(source_dir.glob('**/*.pdf')))}"
    )

    return 0


if __name__ == "__main__":
    exit(main())
