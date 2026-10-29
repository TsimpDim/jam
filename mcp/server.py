import os

from app import mcp

import tools.analytics
import tools.auth
import tools.cvs
import tools.groups
import tools.job_applications
import tools.leads
import tools.notifications
import tools.steps

if os.getenv("JAM_MCP_DEBUG") == "True":
    if __name__ == "__main__":
        mcp.run(transport="streamable-http", host="0.0.0.0", port=3001)
