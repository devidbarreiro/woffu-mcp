#!/usr/bin/env node

/**
 * woffu-mcp — MCP server for Woffu (clock in/out, status, vacations, holidays)
 *
 * Environment variables:
 *   WOFFU_COMPANY  — company subdomain (e.g. "mycompany" for mycompany.woffu.com)
 *   WOFFU_EMAIL    — user email
 *   WOFFU_PASSWORD — user password
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { WoffuClient } from "./woffu-client.js";

// ── Environment ─────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it before starting the server.`,
    );
  }
  return value;
}

const WOFFU_COMPANY = requireEnv("WOFFU_COMPANY");
const WOFFU_EMAIL = requireEnv("WOFFU_EMAIL");
const WOFFU_PASSWORD = requireEnv("WOFFU_PASSWORD");

const client = new WoffuClient(WOFFU_COMPANY);

// ── Server ──────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "woffu-mcp",
  version: "1.0.0",
});

// ── Tools ───────────────────────────────────────────────────────────────────

server.tool(
  "clock_toggle",
  "Toggle clock in/out on Woffu. Auto-detects whether the next action is entry or exit. Skips on holidays and weekends.",
  {},
  async () => {
    try {
      const result = await client.toggle(WOFFU_EMAIL, WOFFU_PASSWORD);

      if (result.action === "skip") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "skipped",
                  reason: result.reason,
                  user: result.user,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "ok",
                action: result.action,
                user: result.user,
                time: result.time,
                totalSigns: result.signsCount,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "clock_in",
  "Force clock in on Woffu. Does nothing if already clocked in. Skips on holidays and weekends.",
  {},
  async () => {
    try {
      const result = await client.clockIn(WOFFU_EMAIL, WOFFU_PASSWORD);

      if (result.action === "skip") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "skipped",
                  reason: result.reason,
                  user: result.user,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "ok",
                action: "entrada",
                user: result.user,
                time: result.time,
                totalSigns: result.signsCount,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "clock_out",
  "Force clock out on Woffu. Does nothing if not clocked in. Skips on holidays and weekends.",
  {},
  async () => {
    try {
      const result = await client.clockOut(WOFFU_EMAIL, WOFFU_PASSWORD);

      if (result.action === "skip") {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  status: "skipped",
                  reason: result.reason,
                  user: result.user,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "ok",
                action: "salida",
                user: result.user,
                time: result.time,
                totalSigns: result.signsCount,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "get_status",
  "Get current Woffu status: whether you are clocked in or out, today's sign entries, schedule, and vacation balance.",
  {},
  async () => {
    try {
      const result = await client.status(WOFFU_EMAIL, WOFFU_PASSWORD);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "get_week_summary",
  "Get a summary of hours worked this week (Monday to Friday) vs scheduled hours, per day.",
  {},
  async () => {
    try {
      const result = await client.weekSummary(WOFFU_EMAIL, WOFFU_PASSWORD);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "get_vacations",
  "Get vacation day balance: allocated, used, available, enjoyed, accumulated, and balance days.",
  {},
  async () => {
    try {
      const token = await client.login(WOFFU_EMAIL, WOFFU_PASSWORD);
      const user = await client.getUser(token);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                user: user.name,
                vacation: user.vacation,
              },
              null,
              2,
            ),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

server.tool(
  "get_holidays",
  "Get company holidays for a given year. Defaults to the current year.",
  {
    year: z
      .number()
      .int()
      .min(2020)
      .max(2100)
      .optional()
      .describe("Year to fetch holidays for (default: current year)"),
  },
  async ({ year }) => {
    try {
      const result = await client.holidays(
        WOFFU_EMAIL,
        WOFFU_PASSWORD,
        year,
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      return errorResult(err);
    }
  },
);

// ── Helpers ─────────────────────────────────────────────────────────────────

function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true as const,
    content: [
      {
        type: "text" as const,
        text: `Error: ${message}`,
      },
    ],
  };
}

// ── Start ───────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error starting woffu-mcp:", err);
  process.exit(1);
});
