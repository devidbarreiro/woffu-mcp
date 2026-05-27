# woffu-mcp

MCP (Model Context Protocol) server for [Woffu](https://www.woffu.com/) — the Spanish HR and attendance platform. Any MCP-compatible AI agent can use this to clock in/out, check work status, view vacation balances, and more.

## Tools

| Tool | Description |
|------|-------------|
| `clock_toggle` | Toggle clock in/out (auto-detects entry or exit) |
| `clock_in` | Force clock in (skips if already clocked in) |
| `clock_out` | Force clock out (skips if not clocked in) |
| `get_status` | Current status: working/not, today's signs, schedule, vacation days |
| `get_week_summary` | Hours worked this week vs scheduled, per day |
| `get_vacations` | Vacation balance (allocated, used, available, enjoyed) |
| `get_holidays` | Company holidays for a given year (default: current year) |

## Install

```bash
npm install -g woffu-mcp
```

Or run directly with npx:

```bash
npx woffu-mcp
```

## Configuration

Set these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `WOFFU_COMPANY` | Yes | Company subdomain (e.g. `mycompany` for mycompany.woffu.com) |
| `WOFFU_EMAIL` | Yes | Your Woffu login email |
| `WOFFU_PASSWORD` | Yes | Your Woffu password |

## Usage

### Claude Code

Add to your Claude Code MCP settings (`~/.claude.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@example.com",
        "WOFFU_PASSWORD": "mypassword"
      }
    }
  }
}
```

Then you can ask Claude things like:
- "Clock me in on Woffu"
- "Am I currently clocked in?"
- "How many hours have I worked this week?"
- "How many vacation days do I have left?"
- "What are the company holidays this year?"

### Cursor

Add to your Cursor MCP settings (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@example.com",
        "WOFFU_PASSWORD": "mypassword"
      }
    }
  }
}
```

### Hermes / Other MCP clients

Any MCP-compatible client can use this server. The configuration pattern is always the same — point the client at `npx woffu-mcp` (or the global binary `woffu-mcp`) and provide the three environment variables.

Example for a generic MCP client config:

```json
{
  "command": "npx",
  "args": ["-y", "woffu-mcp"],
  "env": {
    "WOFFU_COMPANY": "mycompany",
    "WOFFU_EMAIL": "me@example.com",
    "WOFFU_PASSWORD": "mypassword"
  }
}
```

## How it works

The server authenticates against the Woffu API using your credentials on each tool call. Clock in/out logic is based on sign count parity — if the number of signs today is even, the next action is an entry; if odd, it's an exit. The server automatically skips clocking on holidays and weekends.

## Development

```bash
git clone https://github.com/devidbarreiro/woffu-mcp.git
cd woffu-mcp
npm install
npm run build
```

To test locally:

```bash
WOFFU_COMPANY=mycompany WOFFU_EMAIL=me@example.com WOFFU_PASSWORD=secret node dist/index.js
```

## License

MIT
