from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def read_steps(ctx: Context) -> list:
    """Read the available overarching steps that can be used in job applications for this user."""
    return api_request("GET", "/jam/steps/", ctx)
