from mcp.server import MCPServer
import os
import requests
from pathlib import Path

# Initialize MCPServer
mcp = MCPServer("JAM!")

# Configuration
API_BASE = os.getenv("JAM_API_BASE", "http://jobappman-api:8000")
TOKEN_DIR = Path.home() / ".jam-mcp"
TOKEN_FILE = TOKEN_DIR / "token"


def ensure_token_dir():
    TOKEN_DIR.mkdir(parents=True, exist_ok=True)


def save_token(token: str):
    ensure_token_dir()
    TOKEN_FILE.write_text(token)


def get_token(token: str = None) -> str:
    if token:
        return token
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text().strip()
    raise RuntimeError("No token found. Call login() first or provide token argument.")


def api_request(method: str, path: str, token: str = None, **kwargs):
    auth_token = get_token(token)
    headers = {"Authorization": f"Token {auth_token}"}
    response = requests.request(method, f"{API_BASE}{path}", headers=headers, **kwargs)
    response.raise_for_status()
    return response.json()


@mcp.tool()
def login(username: str, password: str) -> str:
    """Authenticate with JAM and save an MCP token for subsequent calls."""
    session = requests.Session()
    response = session.post(
        f"{API_BASE}/auth/login/",
        json={"username": username, "password": password},
    )
    response.raise_for_status()
    user_data = response.json()["user"]

    token_response = session.post(f"{API_BASE}/auth/mcp-token/", json={})
    token_response.raise_for_status()
    data = token_response.json()
    save_token(data["token"])
    return f"Authenticated as {user_data['username']}. MCP token saved for future calls."


@mcp.tool()
def whoami(token: str = None) -> dict:
    """Get the current authenticated user info. Optionally provide a token."""
    return api_request("GET", "/auth/me/", token=token)


@mcp.tool()
def read_job_apps(token: str = None) -> list:
    """Read job applications. Optionally provide a token."""
    return api_request("GET", "/jam/applications/", token=token)


@mcp.tool()
def read_leads(token: str = None) -> list:
    """Read leads. Optionally provide a token."""
    return api_request("GET", "/jam/leads/", token=token)


@mcp.tool()
def revoke_token() -> str:
    """Revoke the stored MCP token and delete it from local storage."""
    TOKEN_FILE.unlink(missing_ok=True)
    return "MCP token revoked and deleted locally."


if os.getenv("JAM_MCP_DEBUG") == "True":
    if __name__ == "__main__":
        mcp.run(transport="streamable-http", host="0.0.0.0", port=3001)