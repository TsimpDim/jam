from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def read_leads(ctx: Context, archived: bool = False) -> list:
    """Read the authenticated user's leads."""
    return api_request("GET", f"/jam/leads/?archived={archived}", ctx)

@mcp.tool()
def create_lead(
    ctx: Context,
    company: str,
    role: str = None,
    location: str = None,
    externalLink: str = None,
    notes: str = None,
    groupId: int = None,
    archived: bool = False,
) -> dict:
    """Create a new lead for the authenticated user.

    Required: company. The rest are optional.
    """
    payload = {"company": company, "archived": archived}

    optional = {
        "role": role,
        "location": location,
        "external_link": externalLink,
        "notes": notes,
        "group": groupId,
    }
    payload.update({k: v for k, v in optional.items() if v is not None})

    return api_request("POST", "/jam/leads/", ctx, json=payload)
