# Local Kilo Code Config

```JSON
{
  "mcp": {
    "jam": {
      "type": "remote",
      "url": "http://localhost:3001/mcp",
      "headers": {
        "Authorization": "Token <Token>"
      },
      "enabled": true
    }
  }
}
```

# Remote Kilo Code Config

```JSON
{
  "mcp": {
    "jam-prod": {
      "type": "remote",
      "url": "https://mcp.jam-app.com/mcp",
      "headers": {
        "Authorization": "Token <Token>"
      },
      "enabled": true
    }
  }
}
```
