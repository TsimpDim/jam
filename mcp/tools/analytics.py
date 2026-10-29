from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def read_analytics(ctx: Context) -> list:
    """Read the analytics report of the authenticated user's overarching job application process."""
    return api_request("GET", "/jam/analytics/", ctx)

@mcp.tool()
def read_analytics_of_group(ctx: Context, groupId: str) -> list:
    """Read the analytics report of the authenticated user's overarching job application process, per group."""
    return api_request("GET", f"/jam/analytics/?group={groupId}", ctx)
