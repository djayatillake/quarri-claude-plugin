#!/usr/bin/env node
/**
 * Quarri MCP Server
 *
 * Model Context Protocol server for the Quarri Data Assistant.
 * Provides 47 tools for natural language data analysis.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { QuarriApiClient } from './api/client.js';
import {
  loadCredentials,
  getSelectedDatabase,
  setSelectedDatabase,
} from './auth/token-store.js';
import {
  TOOL_DEFINITIONS,
  getBackendToolName,
} from './tools/definitions.js';
// UI_RESOURCES disabled - Claude Desktop doesn't support custom MIME types
// import { UI_RESOURCES } from './ui/resources.js';

// Initialize API client
const client = new QuarriApiClient();

// Embedded 32x32 Quarri icon as data URI (971 bytes)
const QUARRI_ICON_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADkklEQVR4nL2XaahNURTHf/ccwzNPzyxDSeahSCmZkuHJPPsmUmYppWcsZChJFJ/wwawQiuKL+CCRIVPkEZkicxnf0ar/0XrHve7j3fdWnc6+/332Xv+9pr0ulF0CPRUiAVBJ4xpALzdneKqiiDQCrgARcARo7+bCXCsLdTo7fXdgiPBOwHGRKAZWA7Vz6ZYgYdJ2wCspPAw0Fz4cuC+8CJiUIP/Pbkk5P5tMBKZr3BTYJ2WRTh1LIfBD+Bmg5//ER8qNza9HnbJLLuj6AteFPwHGCW8GHHJrtop0LEFplNcAVsqvtslemfWpfu8C6ujb2cBn4WeBDsIHATeFvwHmApXTHPIPf3cB7mrhHW2EzHnLnewTsFBzNYGdbm4LUFVz9s0H4VeB3tLzhyUq6T1FH29QADUEDgh7B0wGWrjT3QP6a61lyAXhb4EZwhsDe4SvTej7LTEwBvgJdAR6AB+1cLNMWBfYIfc8Bx5p3mKlifaYpjnDL6tmtNO+hdkIjNXCHvK7jQdqbhHwXdhBoLVIFabJCnPLNmGDdSAbLy8tgW6yhp20OjDL+TGOCy9tXPQ/VDa01an7AZ0zEQjILCk9eXpssxHAOVcZ45pRpHoxR2RaKRADKX6v9TYuIUHid5QmVeJ0DN1T7PAfckWgilgsZfHeVYACrcvLZProL5ZIEvabe5L2VNOcBe9XfbsfyAdOKxtSwksQoJREvmW47VLCzRomA+SuUIXKSvkJFbkSOoIsCpPE8sW+2BGJFRteT99uB4YBy5Qt54GTwIpsQRhlOJ0pNLkILHCuiM1pabcK2C3skAqQFZ7FKkwWB7cz6Qn1HqnJ7i4l7VTzNb6m93XVByMyXqkXqVyb+dH8A+EXXdOS9i4I9R4lc3oCdR2B6lIYX0A39P4qy6CKeNRdRJaeJhOAmQl9vyUGCrTQrt3RzgJzXAWsrxzfIWyPSJKoiutkIWtcjmW7C3BFZ6luxUnyvW0+z20cySK4FszatMeas3RrKXyFW7MJaOAKXFYZq4X5ImBk+qjbiRRQI525n8uCcZv21PUJdreUWkJXZsfIBUu0WRxgk3U9x6ezDEBX9SlhL4CpuWrbxwFftPFumT4UMav7qIuKCW10cVGmDjl0i7uqmEQiY+2YyVBn7jP6zq/PiQRuPN41Ii/1fpZox8vlX1LgiNQC1gCvgfW5/kOSTbxZa2fAy11Sicuowv6UpiNSJvkFzuMCrxHaJBsAAAAASUVORK5CYII=';

// Initialize MCP server
// Resources capability re-enabled with empty responses to prevent -32601 errors
// Claude Desktop may have cached old resource lists and tries to read them
const server = new Server(
  {
    name: 'quarri',
    version: '1.0.0',
    icons: [
      {
        src: `data:image/png;base64,${QUARRI_ICON_BASE64}`,
        mimeType: 'image/png',
        sizes: ['32x32'],
      },
    ],
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

/**
 * Ensure user is authenticated before tool execution
 * Returns credentials or throws an error with auth instructions
 */
async function ensureAuthenticated(): Promise<boolean> {
  const credentials = loadCredentials();

  if (credentials) {
    client.setToken(credentials.token);
    return true;
  }

  // Don't run interactive auth in MCP context - it conflicts with stdio protocol
  // Instead, return false and the caller will provide instructions
  return false;
}

/**
 * Generate authentication instructions for unauthenticated users
 */
function getAuthInstructions(): string {
  return `
Not authenticated with Quarri.

**New to Quarri?** Create a free trial account:

  npx @quarri/claude-data-tools signup

**Existing account?** Log in with:

  npx @quarri/claude-data-tools auth

After authenticating, restart Claude Code to pick up the credentials.
`.trim();
}

// Resource handlers - return empty/safe responses to prevent -32601 errors
// Claude Desktop may have cached old resource lists and tries to read them
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return { resources: [] };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  // For ui:// scheme URIs (cached from old versions), return valid empty HTML
  // Claude Desktop expects text/html;profile=mcp-app for UI resources
  if (uri.startsWith('ui://')) {
    return {
      contents: [
        {
          uri: uri,
          mimeType: 'text/html;profile=mcp-app',
          text: '<!-- Resource no longer available -->',
        },
      ],
    };
  }
  // For other URIs, return proper error
  throw new McpError(
    ErrorCode.InvalidRequest,
    `Resource not found: ${uri}`
  );
});

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      ...(tool._meta && { _meta: tool._meta }),
    })),
  };
});

/**
 * Handle tool execution request
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Handle auth_status before authentication check (for debugging)
  if (name === 'quarri_auth_status') {
    const credentials = loadCredentials();
    const selected = getSelectedDatabase();

    if (!credentials) {
      const unauthData = {
        authenticated: false,
        message: 'Not authenticated. Run: npx @quarri/claude-data-tools auth',
      };
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(unauthData, null, 2),
          },
        ],
      };
    }

    const expiresAt = new Date(credentials.expiresAt);
    const isExpired = expiresAt < new Date();
    const expiresIn = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const authData = {
      authenticated: !isExpired,
      email: credentials.email,
      role: credentials.role,
      databases: credentials.databases.map(d => d.display_name || d.database_name),
      selectedDatabase: selected,
      tokenExpires: credentials.expiresAt,
      expiresInDays: isExpired ? 'EXPIRED' : expiresIn,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(authData, null, 2),
        },
      ],
    };
  }

  // Ensure authenticated for all other tools
  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    return {
      content: [
        {
          type: 'text',
          text: getAuthInstructions(),
        },
      ],
      isError: true,
    };
  }

  if (name === 'quarri_list_databases') {
    const credentials = loadCredentials();
    if (!credentials) {
      throw new McpError(ErrorCode.InvalidRequest, 'Not authenticated');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            databases: credentials.databases,
            selected: getSelectedDatabase(),
          }, null, 2),
        },
      ],
    };
  }

  if (name === 'quarri_select_database') {
    const databaseName = (args as { database_name: string }).database_name;
    const success = setSelectedDatabase(databaseName);

    if (!success) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Database '${databaseName}' not found or access denied`
      );
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Selected database: ${databaseName}`,
          }, null, 2),
        },
      ],
    };
  }

  // Handle trial status
  if (name === 'quarri_trial_status') {
    const result = await client.getTrialStatus();

    if (!result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: result.error || 'Failed to get trial status',
            }, null, 2),
          },
        ],
        isError: true,
      };
    }

    const data = result.data;
    if (!data || !data.is_trial) {
      const nonTrialData = {
        is_trial: false,
        message: 'This is not a trial account.',
        database: data?.display_name || data?.database_name,
      };
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(nonTrialData, null, 2),
          },
        ],
      };
    }

    const trialData = {
      is_trial: true,
      organization: data.display_name,
      days_remaining: data.days_remaining,
      expires_at: data.expires_at,
      data_limit_gb: data.data_limit_gb,
      signup_type: data.signup_type,
      upgrade_contact: data.upgrade_contact,
      message: data.days_remaining && data.days_remaining <= 2
        ? `⚠️ Your trial expires in ${data.days_remaining} day(s). Contact ${data.upgrade_contact} to upgrade.`
        : `Trial active with ${data.days_remaining} days remaining.`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trialData, null, 2),
        },
      ],
    };
  }

  // Map MCP tool name to backend tool name
  const backendToolName = getBackendToolName(name);
  if (!backendToolName) {
    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
  }

  // Get selected database
  const databaseName = getSelectedDatabase();

  // Check if database is required but not selected
  if (!databaseName) {
    const credentials = loadCredentials();
    if (credentials && credentials.databases.length > 0) {
      // Auto-select first database if available
      const firstDb = credentials.databases[0].database_name;
      setSelectedDatabase(firstDb);
      console.error(`Auto-selected database: ${firstDb}`);
    } else {
      return {
        content: [
          {
            type: 'text',
            text: 'No database selected. Use quarri_list_databases to see available databases, then quarri_select_database to choose one.',
          },
        ],
        isError: true,
      };
    }
  }

  // Execute tool via API
  const result = await client.executeTool(
    backendToolName,
    args as Record<string, unknown>,
    getSelectedDatabase() ?? undefined
  );

  // Format response based on tool type
  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: formatErrorResponse(result.error || 'Unknown error'),
        },
      ],
      isError: true,
    };
  }

  // Build response with text and optional UI resource
  const content: Array<{ type: string; text?: string; resource?: { uri: string; mimeType: string; text: string } }> = [
    {
      type: 'text',
      text: formatToolResponse(name, result),
    },
  ];

  // Add UI resource if available for this tool
  const uiResourceContent = buildUIResource(name, result);
  if (uiResourceContent) {
    content.push(uiResourceContent);
  }

  return { content };
});

/**
 * Build UI resource for a tool response
 */
function buildUIResource(
  _toolName: string,
  _result: Record<string, unknown>
): { type: string; resource: { uri: string; mimeType: string; text: string } } | null {
  // UI resources disabled for now - Claude Desktop only supports text/html;profile=mcp-app
  // Our custom MIME types (application/vnd.quarri.*+json) are not supported yet
  // TODO: Re-enable when Claude Desktop adds support for custom MIME types
  return null;
}

/**
 * Format error response for better readability
 */
function formatErrorResponse(error: string): string {
  return `Error: ${error}`;
}

/**
 * Format tool response based on the tool type
 */
function formatToolResponse(toolName: string, result: Record<string, unknown>): string {
  // For query tools, show SQL prominently
  if (toolName === 'quarri_query_agent' && result.sql) {
    const parts = [`SQL Query:\n\`\`\`sql\n${result.sql}\n\`\`\``];
    if (result.explanation) {
      parts.push(`\nExplanation: ${result.explanation}`);
    }
    return parts.join('\n');
  }

  // For execute_sql, format results as table if possible
  if (toolName === 'quarri_execute_sql' && result.rows && Array.isArray(result.rows)) {
    const rows = result.rows as Record<string, unknown>[];
    const columns = result.columns as string[] || (rows.length > 0 ? Object.keys(rows[0]) : []);

    if (rows.length === 0) {
      return 'No results returned.';
    }

    // Format as simple text table
    const header = columns.join(' | ');
    const separator = columns.map(() => '---').join(' | ');
    const dataRows = rows.slice(0, 20).map(row =>
      columns.map(col => String(row[col] ?? '')).join(' | ')
    );

    let output = `| ${header} |\n| ${separator} |\n`;
    output += dataRows.map(r => `| ${r} |`).join('\n');

    if (rows.length > 20) {
      output += `\n\n... and ${rows.length - 20} more rows`;
    }

    return output;
  }

  // For schema, format nicely
  if (toolName === 'quarri_get_schema' && result.tables) {
    const tables = result.tables as Array<{ name: string; columns: Array<{ name: string; type: string }> }>;
    return tables.map(t =>
      `**${t.name}**\n${t.columns.map(c => `  - ${c.name}: ${c.type}`).join('\n')}`
    ).join('\n\n');
  }

  // For analysis pipeline, structure the output
  if (toolName === 'quarri_query_with_analysis') {
    const parts: string[] = [];

    if (result.sql) {
      parts.push(`## Query\n\`\`\`sql\n${result.sql}\n\`\`\``);
    }

    if (result.data && Array.isArray(result.data)) {
      const data = result.data as Record<string, unknown>[];
      parts.push(`## Data (${data.length} rows)`);
    }

    if (result.statistics) {
      parts.push(`## Statistics\n${JSON.stringify(result.statistics, null, 2)}`);
    }

    if (result.insights) {
      // Handle insights as array of objects or string
      if (Array.isArray(result.insights)) {
        const insightText = (result.insights as Array<{ insight?: string; finding?: string; title?: string; description?: string }>)
          .map((i, idx) => {
            if (typeof i === 'string') return `${idx + 1}. ${i}`;
            const title = i.title || 'Insight';
            const content = i.finding || i.description || i.insight || '';
            return `${idx + 1}. **${title}**: ${content}`;
          })
          .join('\n');
        parts.push(`## Insights\n${insightText}`);
      } else if (typeof result.insights === 'string') {
        parts.push(`## Insights\n${result.insights}`);
      } else {
        parts.push(`## Insights\n${JSON.stringify(result.insights, null, 2)}`);
      }
    }

    if (result.chart) {
      parts.push(`## Chart\nChart configuration included in response.`);
    }

    return parts.join('\n\n');
  }

  // Default: return formatted JSON
  return JSON.stringify(result, null, 2);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Create transport and connect immediately - don't block on health check
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Quarri MCP server started');

  // Non-blocking health check after server is ready
  client.healthCheck().then((health) => {
    if (!health.success) {
      console.error('Warning: Could not connect to Quarri API');
    }
  }).catch(() => {
    console.error('Warning: Health check failed');
  });
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
