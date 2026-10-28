from mcp.server import MCPServer
import os

# Initialize MCPServer
mcp = MCPServer("JAM!")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b


@mcp.resource("greeting://{name}")
def greeting(name: str) -> str:
    """Greet someone by name."""
    return f"Hello, {name}!"

if os.getenv("JAM_MCP_DEBUG") == "True":
    if __name__ == "__main__":
        mcp.run(transport="streamable-http", host="0.0.0.0", port=3001)