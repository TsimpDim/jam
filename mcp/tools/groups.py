from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def read_groups(ctx: Context) -> list:
    """Read the authenticated user's groups. Always ask the user if they 
    want to interact with a particular group or to create a new one in case only one exists."""
    return api_request("GET", "/jam/groups/", ctx)

@mcp.tool()
def create_group(ctx: Context, name: str, description: str = None) -> dict:
    """Create a new group for the authenticated user.

    Required: name. The rest are optional.
    """
    payload = {"name": name}
    if description is not None:
        payload["description"] = description

    return api_request("POST", "/jam/groups/", ctx, json=payload)
