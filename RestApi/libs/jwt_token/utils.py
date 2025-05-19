from ..supaclient import supabase_client
from datetime import datetime, timezone


def is_premium(user_id: str):
    timestampTZ: str = supabase_client.table("paid_users").select("paid_until").eq("id", user_id).execute().data[0]["paid_until"]
    if timestampTZ is None:
        return False
    
    given_date = datetime.fromisoformat(timestampTZ)
    if datetime.now(timezone.utc) < given_date:
        return True
    
    return False