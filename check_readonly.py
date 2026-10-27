import asyncio, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.update(TG_API_ID="1", TG_API_HASH="x", TG_SESSION="")
from telethon import functions, types
from telethon.sessions import StringSession
from readonly_client import ReadOnlyTelegramClient, ReadOnlyViolation

peer = types.InputPeerSelf()
blocked = [
    functions.messages.SendMessageRequest(peer=peer, message="hi"),
    functions.messages.ReadHistoryRequest(peer=peer, max_id=0),
    functions.messages.DeleteMessagesRequest(id=[1]),
    functions.messages.EditMessageRequest(peer=peer, id=1, message="x"),
    functions.messages.ForwardMessagesRequest(from_peer=peer, id=[1], to_peer=peer),
    functions.account.ResetAuthorizationRequest(hash=1),
    functions.auth.ExportAuthorizationRequest(dc_id=2),
    functions.upload.GetFileRequest(location=types.InputPeerPhotoFileLocation(peer=peer, photo_id=1), offset=0, limit=1024),
    functions.channels.JoinChannelRequest(channel=types.InputChannelEmpty()),
    [functions.messages.GetHistoryRequest(peer=peer, offset_id=0, offset_date=None, add_offset=0, limit=1, max_id=0, min_id=0, hash=0),
     functions.messages.SendMessageRequest(peer=peer, message="hidden in batch")],
]
async def main():
    c = ReadOnlyTelegramClient(StringSession(), 1, "x", receive_updates=False)
    ok = 0
    for r in blocked:
        try:
            await c(r); print("NOT BLOCKED", r)
        except ReadOnlyViolation as e:
            ok += 1
    print(f"blocked {ok}/{len(blocked)}")
    # allowed request should pass the guard and fail only on connection
    try:
        await c(functions.updates.GetStateRequest())
    except ReadOnlyViolation:
        print("WRONGLY BLOCKED")
    except Exception as e:
        print("allowed request passed guard ->", type(e).__name__)
asyncio.run(main())
