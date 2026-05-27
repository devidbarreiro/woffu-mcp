<p align="center">
  <img src="docs/logo.svg" alt="woffu-mcp" width="240" />
</p>

<p align="center">
  <strong>MCP server for <a href="https://www.woffu.com/">Woffu</a> — clock in/out, check status, vacations, weekly hours, and holidays from any AI agent.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/woffu-mcp"><img src="https://img.shields.io/npm/v/woffu-mcp?style=for-the-badge&color=38bdf8" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-34d399?style=for-the-badge" alt="License: MIT"></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-Compatible-a78bfa?style=for-the-badge" alt="MCP"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node"></a>
</p>

<p align="center">
  <a href="https://devidbarreiro.github.io/woffu-mcp/">Landing Page</a> &middot;
  <a href="https://www.npmjs.com/package/woffu-mcp">npm</a> &middot;
  <a href="https://github.com/devidbarreiro/woffu-mcp">GitHub</a>
</p>

> "Fichame" — and you're clocked in. From your terminal, your phone, or any AI agent.

---

## What is this?

Woffu MCP turns your AI coding agent into your attendance assistant. Instead of opening the Woffu web app every morning and evening, just tell your agent:

- *"Clock me in"* / *"Fichame"*
- *"Am I clocked in?"* / *"Estoy fichado?"*
- *"How many hours have I worked this week?"*
- *"How many vacation days do I have left?"*
- *"What are the next holidays?"*

It works in English and Spanish — the server handles the Woffu API for you.

---

## Tools

| Tool | Description |
|------|-------------|
| `clock_toggle` | Toggle clock in/out — auto-detects if next action is entry or exit |
| `clock_in` | Force clock in only — skips if already clocked in |
| `clock_out` | Force clock out only — skips if not clocked in |
| `get_status` | Current status: working/out, today's signs with times, schedule, vacation balance |
| `get_week_summary` | Hours worked this week (Mon–Fri) vs scheduled hours, per day |
| `get_vacations` | Vacation balance: allocated, used, available, enjoyed, accumulated |
| `get_holidays` | Company holidays for a given year (default: current year) |

All clock tools automatically skip on **holidays and weekends** — no accidental signs on days off.

---

## Quick Start

### 1. Install

```bash
npx woffu-mcp
```

Or install globally:

```bash
npm install -g woffu-mcp
```

### 2. Configure

You need three environment variables:

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `WOFFU_COMPANY` | Yes | `mycompany` | Your company subdomain (`mycompany`.woffu.com) |
| `WOFFU_EMAIL` | Yes | `me@company.com` | Your Woffu login email |
| `WOFFU_PASSWORD` | Yes | `********` | Your Woffu password |

### 3. Connect to your agent

Pick your tool and add the config:

<details>
<summary><strong>Claude Code</strong></summary>

Add to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@company.com",
        "WOFFU_PASSWORD": "your-password"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@company.com",
        "WOFFU_PASSWORD": "your-password"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code (GitHub Copilot)</strong></summary>

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@company.com",
        "WOFFU_PASSWORD": "your-password"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@company.com",
        "WOFFU_PASSWORD": "your-password"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Hermes Agent</strong></summary>

Add to `~/.hermes/config.yaml`:

```yaml
mcp_servers:
  woffu:
    command: npx
    args:
      - "-y"
      - "woffu-mcp"
    env:
      WOFFU_COMPANY: "mycompany"
      WOFFU_EMAIL: "me@company.com"
      WOFFU_PASSWORD: "your-password"
    enabled: true
```

</details>

<details>
<summary><strong>Claude Desktop</strong></summary>

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "woffu": {
      "command": "npx",
      "args": ["-y", "woffu-mcp"],
      "env": {
        "WOFFU_COMPANY": "mycompany",
        "WOFFU_EMAIL": "me@company.com",
        "WOFFU_PASSWORD": "your-password"
      }
    }
  }
}
```

</details>

---

## Example Interactions

```
You: "Fichame"
Agent: Clocked in! Entry registered at 09:02:15 (3 signs today)

You: "How's my week looking?"
Agent: Here's your week summary:
  Mon 26/05: 8h 32m / 8h 45m
  Tue 27/05: 6h 15m / 8h 45m (in progress)
  Wed 28/05: — / 8h 45m
  Thu 29/05: — / 8h 45m
  Fri 30/05: — / 5h 00m

You: "How many vacation days do I have?"
Agent: You have 18 days available out of 23 allocated (5 used)

You: "Next holidays?"
Agent: Upcoming company holidays:
  2026-06-15 — San Isidro
  2026-08-15 — Asuncion de la Virgen
  ...
```

---

## How It Works

```
Your Agent ──MCP──> woffu-mcp ──HTTPS──> Woffu API
                    (stdio)              (company.woffu.com)
```

1. Your AI agent sends a tool call via MCP (stdio transport)
2. `woffu-mcp` authenticates against the Woffu API with your credentials
3. Executes the requested action (clock, status query, etc.)
4. Returns structured data back to your agent

**Clock logic:** Entry vs exit is determined by sign count parity — even count means next is entry, odd means exit. The server handles this automatically.

**Safety:** Clock tools skip on holidays and weekends to prevent accidental signs.

---

## Development

```bash
git clone https://github.com/devidbarreiro/woffu-mcp.git
cd woffu-mcp
npm install
npm run build
```

Test locally:

```bash
WOFFU_COMPANY=mycompany WOFFU_EMAIL=me@company.com WOFFU_PASSWORD=secret node dist/index.js
```

---

## What is Woffu?

[Woffu](https://www.woffu.com/) is an HR platform popular in Spain and Latin America for time tracking, attendance management, vacation management, and shift planning. It's used by thousands of companies to comply with Spanish labor law requirements for employee time tracking (Real Decreto-ley 8/2019).

---

## What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io) (MCP) is an open standard created by Anthropic that lets AI agents connect to external tools and data sources. Think of it as USB-C for AI — one protocol, many tools. Any agent that supports MCP can use this server.

---

## License

MIT — use it however you want.

---

Built by [David Barreiro](https://github.com/devidbarreiro) with Claude Code.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-dbarreiro02-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/dbarreiro02/)
[![Instagram](https://img.shields.io/badge/Instagram-davidbarreirooo-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/davidbarreirooo/)
