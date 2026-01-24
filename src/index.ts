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
  isAuthenticated,
} from './auth/token-store.js';
import { runAuthFlow } from './auth/cli-auth.js';
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
 */
async function ensureAuthenticated(): Promise<boolean> {
  const credentials = loadCredentials();

  if (credentials) {
    client.setToken(credentials.token);
    return true;
  }

  // Run interactive auth flow
  const result = await runAuthFlow(client);
  if (result) {
    client.setToken(result.token);
    return true;
  }

  return false;
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

  // Ensure authenticated
  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'Authentication required. Please run the auth flow.'
    );
  }

  // Handle special session management tools
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

  // Execute tool via API
  const result = await client.executeTool(
    backendToolName,
    args as Record<string, unknown>,
    databaseName ?? undefined
  );

  // Format response
  if (!result.success) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: result.error,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

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
