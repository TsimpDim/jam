from mcp.server.mcpserver import Context
from utils import api_request
from app import mcp

@mcp.tool()
def read_job_apps(ctx: Context) -> list:
    """Read the authenticated user's job applications."""
    return api_request("GET", "/jam/jobapps/", ctx)

@mcp.tool()
def read_job_app(ctx: Context, jobAppId: str) -> dict:
    """Read the authenticated user's specific job application details."""
    return api_request("GET", f"/jam/jobapps/{jobAppId}/", ctx)

@mcp.tool()
def read_job_app_timeline(ctx: Context, jobAppId: str) -> dict:
    """Read the authenticated user's specific job application timeline details."""
    return api_request("GET", f"/jam/timeline/jobapp/{jobAppId}/", ctx)

@mcp.tool()
def create_job_app(
    ctx: Context,
    company: str,
    role: str,
    groupId: int,
    date: str = None,
    location: str = None,
    appliedThrough: str = None,
    externalLink: str = None,
    notes: str = None,
    initialStepId: int = None,
    leadId: int = None,
    cvUsedId: int = None,
) -> dict:
    """Create a new job application for the authenticated user.

    Required: company, role, groupId. The rest are optional.
    """
    payload = {"company": company, "role": role, "group": groupId}

    optional = {
        "date": date,
        "location": location,
        "applied_through": appliedThrough,
        "external_link": externalLink,
        "notes": notes,
        "initial_step": initialStepId,
        "lead": leadId,
        "cv_used": cvUsedId,
    }
    payload.update({k: v for k, v in optional.items() if v is not None})

    return api_request("POST", "/jam/jobapps/", ctx, json=payload)