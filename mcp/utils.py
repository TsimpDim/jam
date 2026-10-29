from mcp.server.mcpserver import Context
import requests
from config import API_BASE

def _get_token(ctx: Context) -> str:
    headers = ctx.headers or {}
    auth = headers.get("Authorization", headers.get("authorization", ""))
    if not auth:
        raise RuntimeError(
            "No Authorization header. Set it in your MCP client config, e.g. "
            'headers: { "Authorization": "Token <your-token>" }.'
        )
    if not auth.startswith("Token "):
        raise RuntimeError(
            'Authorization header must start with "Token ". '
            f'Got: {auth[:10]}...'
        )
    return auth[6:]

def api_request(method: str, path: str, ctx: Context, **kwargs):
    token = _get_token(ctx)
    headers = {"Authorization": f"Token {token}"}
    response = requests.request(
        method, f"{API_BASE}{path}", headers=headers, **kwargs
    )
    response.raise_for_status()
    return response.json()