from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp_server

@mcp_server.tool()
def read_cvs(ctx: Context) -> list:
    """Read the authenticated user's CVs."""
    return api_request("GET", "/jam/cvs/", ctx)

@mcp_server.tool()
def read_cv(ctx: Context, id: str) -> dict:
    """Read a specific CV by ID."""
    return api_request("GET", f"/jam/cvs/{id}/", ctx)
