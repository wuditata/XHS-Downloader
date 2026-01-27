from contextlib import suppress
from pathlib import Path


def file_switch(path: Path) -> None:
    if path.exists():
        path.unlink()
    else:
        path.touch()


def remove_empty_directories(path: Path) -> None:
    exclude = {
        "\\.",
        "\\_",
        "\\__",
    }
    # 使用os.walk代替path.walk
    import os
    for dir_path, dir_names, file_names in os.walk(
        path,
        topdown=False,
    ):
        dir_path = Path(dir_path)
        if any(i in str(dir_path) for i in exclude):
            continue
        if not dir_names and not file_names:
            with suppress(OSError):
                dir_path.rmdir()
