from json import dumps
from typing import Any

from httpx import AsyncClient, HTTPError

from .static import ERROR, INFO
from .tools import logging
from ..translation import _

__all__ = ["notify_import_webhook"]


async def notify_import_webhook(
    url: str,
    payload: dict[str, Any],
    print_object=None,
    timeout: float = 10.0,
) -> bool:
    """下载完成后回调外部系统（如 Happytime）导入接口。"""
    if not (url := (url or "").strip()):
        return False
    try:
        async with AsyncClient(timeout=timeout, verify=False) as client:
            response = await client.post(
                url,
                content=dumps(payload, ensure_ascii=False).encode("utf-8"),
                headers={"Content-Type": "application/json; charset=utf-8"},
            )
            response.raise_for_status()
        logging(
            print_object,
            _("已通知导入接口：{0}").format(url),
            INFO,
        )
        return True
    except HTTPError as error:
        logging(
            print_object,
            _("通知导入接口失败：{0}").format(repr(error)),
            ERROR,
        )
        return False
