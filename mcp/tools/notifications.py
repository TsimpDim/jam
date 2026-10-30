from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp_server

@mcp_server.tool()
def read_notifications(ctx: Context) -> list:
    """Read the authenticated user's notifications."""
    return api_request("GET", "/jam/notifications/", ctx)
