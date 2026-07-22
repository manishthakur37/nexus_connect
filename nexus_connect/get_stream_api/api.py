
from getstream.models import UserRequest
import frappe
import uuid
from datetime import datetime, timedelta, timezone
from getstream import Stream
from getstream.models import CallRequest, MemberRequest, UserRequest
API_KEY = "xsqmnfhudxz2"
API_SECRET ="7hxr9xpvnryxz7bxuez9pu99j8qvqqrv2qnbw3ubhzfxda3m652dweh9h8jxyg2g"

def get_client():
    return Stream(
        api_key=API_KEY,
        api_secret=API_SECRET,
        timeout=3.0
    )


# ─── User create / upsert ────────────────────────────────────────────────────

@frappe.whitelist(allow_guest=True)
def create_stream_user(user_id):
    """
    Frappe user ko Stream mein register karo.
    Login ke time call karo: create_stream_user(frappe.session.user)
    """
    client = get_client()

    client.upsert_users(
        UserRequest(
            id=user_id,
            name=user_id
        )
    )

    return {"success": True, "user_id": user_id}


# ─── Token ───────────────────────────────────────────────────────────────────
@frappe.whitelist()
def get_user_token():
    client  = get_client()
    user_id = frappe.session.user

    token = client.create_token(
        user_id=user_id,
        expiration=3600  # 1 ghanta, integer seconds
    )

    return {
        "user_id": user_id,
        "token":   token
    }


# ─── Meeting create ──────────────────────────────────────────────────────────

@frappe.whitelist()
def create_meeting(member_ids=None):
    """
    Nayi meeting banao aur join URL return karo.

    Args:
        member_ids (str | list): JSON string ya list of Frappe user IDs
                                 jo meeting mein add karne hain.
                                 Creator automatically admin hota hai.

    Returns:
        dict: call_id aur join_url

    Example (JS se call):
        frappe.call({
            method: "nexus_connect.api.create_meeting",
            args: {
                member_ids: JSON.stringify(["user1@example.com", "user2@example.com"])
            }
        })
    """
    client  = get_client()
    call_id = str(uuid.uuid4())
    creator = frappe.session.user

    # member_ids ko safely parse karo
    if member_ids is None:
        parsed_members = []
    elif isinstance(member_ids, str):
        import json
        try:
            parsed_members = json.loads(member_ids)
        except (ValueError, TypeError):
            parsed_members = []
    else:
        parsed_members = list(member_ids)

    # Creator ko member list mein include karo (duplicate avoid karo)
    all_member_ids = list({creator, *parsed_members})

    members = [
        MemberRequest(
            user_id=uid,
            role="admin" if uid == creator else "user"
        )
        for uid in all_member_ids
    ]

    call = client.video.call("default", call_id)

    call.create(
        data=CallRequest(
            created_by_id=creator,
            members=members,
          
        )
    )

    return {
        "call_id":  call_id,
        "join_url": f"/app/nexus-connect-room?call_id={call_id}"
    }


# ─── Members add karo ────────────────────────────────────────────────────────

@frappe.whitelist()
def add_members(call_id, users):
    """
    Existing meeting mein naaye members add karo.

    Args:
        call_id (str): Stream call ID
        users   (str | list): JSON string ya list of user IDs

    Example:
        frappe.call({
            method: "nexus_connect.api.add_members",
            args: {
                call_id: "abc-123",
                users: JSON.stringify(["newuser@example.com"])
            }
        })
    """
    if not call_id:
        frappe.throw("call_id required hai")

    # users string ho sakti hai Frappe whitelist ki wajah se
    if isinstance(users, str):
        import json
        try:
            user_list = json.loads(users)
        except (ValueError, TypeError):
            frappe.throw("users valid JSON list honi chahiye")
    else:
        user_list = list(users)

    if not user_list:
        return {"added": 0}

    client = get_client()
    call   = client.video.call("default", call_id)

    call.update_call_members(
        update_members=[
            MemberRequest(user_id=uid, role="user")
            for uid in user_list
        ]
    )

    return {
        "added":   len(user_list),
        "call_id": call_id
    }


# ─── Meeting end karo ────────────────────────────────────────────────────────

@frappe.whitelist()
def end_meeting(call_id):
    """
    Meeting end karo (sirf admin kar sakta hai).
    """
    if not call_id:
        frappe.throw("call_id required hai")

    client = get_client()
    call   = client.video.call("default", call_id)
    call.end()

    return {"success": True, "call_id": call_id}