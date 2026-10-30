import os

from app import mcp_server

import tools.analytics
import tools.auth
import tools.cvs
import tools.groups
import tools.job_applications
import tools.leads
import tools.notifications
import tools.steps
from config import API_BASE
from mcp.server.transport_security import TransportSecuritySettings

security = TransportSecuritySettings(
    allowed_hosts=["mcp.jam-app.com"],
    allowed_origins=[],
)
app = mcp_server.streamable_http_app(transport_security=security)

if os.getenv("JAM_MCP_DEBUG") == "True":
    if __name__ == "__main__":
        mcp_server.run(transport="streamable-http", host="0.0.0.0", port=3001)
