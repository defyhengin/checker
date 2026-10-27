"""Telegram client that can only read.

Every request Telethon sends through the user API passes through `_call`.
We check it against an explicit allow-list of read-only methods and refuse
everything else (sending, editing, deleting, marking as read, joining,
changing settings, terminating sessions, downloading files, ...).

This is a second line of defence: the MCP server itself exposes only
reading tools, but if a bug or a future edit ever tried to call something
else, the request would never leave the machine.
"""

import os
from pathlib import Path

from telethon import TelegramClient, functions
from telethon.sessions import StringSession

HERE = Path(__file__).resolve().parent

# Only these Telegram API methods may be called. All of them read data;
# none of them changes anything or marks messages as read.
ALLOWED_REQUESTS = (
    functions.help.GetConfigRequest,          # connection setup
    functions.updates.GetStateRequest,        # "am I logged in?" check
    functions.users.GetUsersRequest,          # who am I / sender info
    functions.messages.GetDialogsRequest,     # chat list (to find allowed chats)
    functions.messages.GetChatsRequest,
    functions.channels.GetChannelsRequest,
    functions.contacts.ResolveUsernameRequest,  # @username -> chat
    functions.messages.GetHistoryRequest,     # read messages (does NOT mark read)
    functions.messages.SearchRequest,         # search inside one chat
    functions.messages.GetMessagesRequest,
    functions.channels.GetMessagesRequest,
)


class ReadOnlyViolation(PermissionError):
    pass


def check_request(request):
    """Raise ReadOnlyViolation unless every request in `request` is allowed."""
    requests = request if isinstance(request, (list, tuple)) else [request]
    for r in requests:
        if not isinstance(r, ALLOWED_REQUESTS):
            raise ReadOnlyViolation(
                f"Заблокировано: {type(r).__name__} не входит в список "
                "разрешённых запросов только для чтения."
            )


class ReadOnlyTelegramClient(TelegramClient):
    async def _call(self, sender, request, *args, **kwargs):
        check_request(request)
        return await super()._call(sender, request, *args, **kwargs)


def load_env(path=HERE / ".env"):
    """Load KEY=VALUE lines from .env next to this file (no extra deps)."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def make_client():
    load_env()
    try:
        api_id = int(os.environ["TG_API_ID"])
        api_hash = os.environ["TG_API_HASH"]
        session = os.environ["TG_SESSION"]
    except KeyError as e:
        raise RuntimeError(
            f"Не задана переменная {e.args[0]} в настройках сервера (Environment на Render)."
        )
    if not session.strip():
        raise RuntimeError("TG_SESSION пустая. Получите строку сессии через colab_login.py.")
    return ReadOnlyTelegramClient(
        StringSession(session.strip()),
        api_id,
        api_hash,
        receive_updates=False,  # no update loop: we only read on request
        connection_retries=2,
        retry_delay=2,
        timeout=15,
        device_model="tg-readonly-mcp",
        app_version="1.0",
    )
