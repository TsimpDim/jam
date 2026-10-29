from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def whoami(ctx: Context) -> dict:
    """Get the authenticated user info."""
    return api_request("GET", "/auth/me/", ctx)
