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

// Initialize API client
const client = new QuarriApiClient();

// Initialize MCP server
const server = new Server(
  {
    name: 'quarri',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
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

To authenticate, run this in your terminal:

  npx @quarri/claude-data-tools auth

Or manually via API:

  # Request a verification code:
  curl -X POST https://app.quarri.ai/api/auth/cli/request-code \\
    -H "Content-Type: application/json" \\
    -d '{"email": "your@email.com"}'

  # Then verify with the code you receive:
  curl -X POST https://app.quarri.ai/api/auth/cli/verify-code \\
    -H "Content-Type: application/json" \\
    -d '{"email": "your@email.com", "code": "123456"}'

  # Save the token to ~/.quarri/credentials

After authenticating, restart Claude Code to pick up the credentials.
`.trim();
}

/**
 * Handle list tools request
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              authenticated: false,
              message: 'Not authenticated. Run: npx @quarri/claude-data-tools auth',
            }, null, 2),
          },
        ],
      };
    }

    const expiresAt = new Date(credentials.expiresAt);
    const isExpired = expiresAt < new Date();
    const expiresIn = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            authenticated: !isExpired,
            email: credentials.email,
            role: credentials.role,
            databases: credentials.databases.map(d => d.display_name || d.database_name),
            selectedDatabase: selected,
            tokenExpires: credentials.expiresAt,
            expiresInDays: isExpired ? 'EXPIRED' : expiresIn,
          }, null, 2),
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

  return {
    content: [
      {
        type: 'text',
        text: formatToolResponse(name, result),
      },
    ],
  };
});

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
  // Check for initial health check
  const health = await client.healthCheck();
  if (!health.success) {
    console.error('Warning: Could not connect to Quarri API');
  }

  // Create transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error('Quarri MCP server started');
}

// Run the server
main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
