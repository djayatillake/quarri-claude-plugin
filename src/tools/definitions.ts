/**
 * Quarri Tool Definitions for MCP Server
 * All tools are prefixed with 'quarri_' to avoid conflicts with other MCP servers
 */

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string };
  default?: unknown;
}

export interface ToolMeta {
  ui?: {
    resourceUri: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
  _meta?: ToolMeta;
}

// Map MCP tool names to backend tool names
// Note: Agent tools have been removed - they are now handled by Claude Code skills
// See /quarri-query, /quarri-analyze, /quarri-stats, etc.
// Note: Canvas tools have been removed - replaced by MCP UI resources
export const TOOL_NAME_MAP: Record<string, string> = {
  // Session tools
  quarri_trial_status: 'trial_status',
  // Data tools (primitives)
  quarri_execute_sql: 'execute_sql',
  quarri_get_schema: 'get_schema',
  quarri_search_values: 'search_values',
  quarri_get_metrics: 'get_metrics',
  quarri_create_metric: 'create_metric',
  quarri_approve_metric: 'approve_metric',
  quarri_get_metric_detail: 'get_metric_detail',
  quarri_search_metrics: 'search_metrics',
  // Config
  quarri_list_agent_prompts: 'list_agent_prompts',
  quarri_update_agent_prompt: 'update_agent_prompt',
  quarri_list_rules: 'list_rules',
  quarri_create_rule: 'create_rule',
  quarri_update_rule: 'update_rule',
  quarri_delete_rule: 'delete_rule',
  quarri_vectorize_column_values: 'vectorize_column_values',
  quarri_list_searchable_columns: 'list_searchable_columns',
  // Team
  quarri_list_teams: 'list_teams',
  quarri_get_team_filters: 'get_team_filters',
  quarri_get_team_restrictions: 'get_team_restrictions',
  // Extraction
  quarri_list_extraction_sources: 'list_extraction_sources',
  quarri_configure_extraction: 'configure_extraction',
  quarri_discover_tables: 'discover_tables',
  quarri_propose_transformation: 'propose_transformation',
  quarri_upload_csv: 'upload_csv',
  quarri_generate_quarri_schema: 'generate_quarri_schema',
  quarri_list_raw_tables: 'list_raw_tables',
  // Debug
  quarri_read_server_logs: 'read_server_logs',
  quarri_query_repl_activity: 'query_repl_activity',
  quarri_read_fly_logs: 'read_fly_logs',
  // Connector management (new for skills-first architecture)
  quarri_log_analysis_run: 'log_analysis_run',
  quarri_schedule_extraction: 'schedule_extraction',
  quarri_store_generated_code: 'store_generated_code',
  quarri_get_connector_code: 'get_connector_code',
  quarri_get_connector_logs: 'get_connector_logs',
  quarri_update_connector_code: 'update_connector_code',
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ==================== DATA TOOLS ====================
  // Note: Agent tools have been removed and are now handled by Claude Code skills:
  // - /quarri-query (replaces quarri_query_agent)
  // - /quarri-analyze (replaces quarri_query_with_analysis, quarri_planning_agent)
  // - /quarri-stats (replaces quarri_stats_agent)
  // - /quarri-chart (replaces quarri_chart_agent)
  // - /quarri-explain (replaces quarri_explain_agent)
  // - /quarri-insights (replaces quarri_insight_agent)
  // - /quarri-extract (replaces quarri_extraction_agent)
  // - /quarri-metric (replaces quarri_metric_builder_agent)
  // - /quarri-debug-connector (new skill for connector healing)
  {
    name: 'quarri_execute_sql',
    description: 'Execute a SQL query against the database. Returns results as JSON.',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT only)',
        },
        limit: {
          type: 'integer',
          description: 'Maximum rows to return (default 100)',
          default: 100,
        },
      },
      required: ['sql'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/data-table' } },
  },
  {
    name: 'quarri_get_schema',
    description:
      'Get database schema information (tables, columns, types, relationships)',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        include_samples: {
          type: 'boolean',
          description: 'Include sample values for columns',
          default: false,
        },
        table_filter: {
          type: 'string',
          description: 'Filter tables by pattern',
        },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/schema-explorer' } },
  },
  {
    name: 'quarri_search_values',
    description: 'Search for values across database columns using semantic search',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text',
        },
        column: {
          type: 'string',
          description: 'Specific column to search (optional)',
        },
        limit: {
          type: 'integer',
          description: 'Maximum results to return',
          default: 10,
        },
      },
      required: ['query'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/search-results' } },
  },
  {
    name: 'quarri_get_metrics',
    description: 'Get list of all defined metrics',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['approved', 'pending', 'all'],
          description: 'Filter by approval status',
        },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/metrics-list' } },
  },
  {
    name: 'quarri_create_metric',
    description: 'Create a new metric definition',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Metric name',
        },
        description: {
          type: 'string',
          description: 'Metric description',
        },
        sql_template: {
          type: 'string',
          description: 'SQL template for the metric',
        },
        dimensions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Available dimensions for grouping',
        },
      },
      required: ['name', 'description', 'sql_template'],
    },
  },
  {
    name: 'quarri_approve_metric',
    description: 'Approve a pending metric definition',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        metric_id: {
          type: 'integer',
          description: 'ID of the metric to approve',
        },
      },
      required: ['metric_id'],
    },
  },
  {
    name: 'quarri_get_metric_detail',
    description: 'Get detailed information about a specific metric',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        metric_id: {
          type: 'integer',
          description: 'ID of the metric',
        },
      },
      required: ['metric_id'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/metric-detail' } },
  },
  {
    name: 'quarri_search_metrics',
    description: 'Search metrics by name or description',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
      },
      required: ['query'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/metrics-list' } },
  },

  // ==================== CONFIGURATION TOOLS ====================
  {
    name: 'quarri_list_agent_prompts',
    description: 'List all agent prompts/system messages',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/prompts-list' } },
  },
  {
    name: 'quarri_update_agent_prompt',
    description: 'Update an agent prompt/system message',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        agent_name: {
          type: 'string',
          description: 'Name of the agent to update',
        },
        prompt: {
          type: 'string',
          description: 'New prompt text',
        },
      },
      required: ['agent_name', 'prompt'],
    },
  },
  {
    name: 'quarri_list_rules',
    description: 'List all agent rules for query generation',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/rules-list' } },
  },
  {
    name: 'quarri_create_rule',
    description: 'Create a new rule for query generation',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_text: {
          type: 'string',
          description: 'The rule text',
        },
        category: {
          type: 'string',
          description: 'Rule category (e.g., "naming", "joins", "filters")',
        },
      },
      required: ['rule_text'],
    },
  },
  {
    name: 'quarri_update_rule',
    description: 'Update an existing rule',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_id: {
          type: 'integer',
          description: 'ID of the rule to update',
        },
        rule_text: {
          type: 'string',
          description: 'New rule text',
        },
        category: {
          type: 'string',
          description: 'New rule category',
        },
      },
      required: ['rule_id', 'rule_text'],
    },
  },
  {
    name: 'quarri_delete_rule',
    description: 'Delete a rule',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_id: {
          type: 'integer',
          description: 'ID of the rule to delete',
        },
      },
      required: ['rule_id'],
    },
  },
  {
    name: 'quarri_vectorize_column_values',
    description: 'Enable semantic search on a column by vectorizing its values',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table containing the column',
        },
        column_name: {
          type: 'string',
          description: 'Column to vectorize',
        },
      },
      required: ['table_name', 'column_name'],
    },
  },
  {
    name: 'quarri_list_searchable_columns',
    description: 'List columns that have been vectorized for semantic search',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/columns-list' } },
  },

  // ==================== TEAM TOOLS ====================
  {
    name: 'quarri_list_teams',
    description: 'List all teams in the organization',
    category: 'team',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/teams-list' } },
  },
  {
    name: 'quarri_get_team_filters',
    description: 'Get row-level filters applied to a team',
    category: 'team',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: {
          type: 'integer',
          description: 'ID of the team',
        },
      },
      required: ['team_id'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/team-filters' } },
  },
  {
    name: 'quarri_get_team_restrictions',
    description: 'Get column-level restrictions for a team',
    category: 'team',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: {
          type: 'integer',
          description: 'ID of the team',
        },
      },
      required: ['team_id'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/team-restrictions' } },
  },

  // ==================== EXTRACTION TOOLS ====================
  {
    name: 'quarri_list_extraction_sources',
    description: 'List available data extraction sources',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/sources-list' } },
  },
  {
    name: 'quarri_configure_extraction',
    description: 'Configure a data extraction source',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        source_name: {
          type: 'string',
          description: 'Name of the data source',
        },
        credentials: {
          type: 'object',
          description: 'Credentials for the source',
        },
        resources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Resources/tables to extract',
        },
      },
      required: ['source_name'],
    },
  },
  {
    name: 'quarri_discover_tables',
    description: 'Discover available tables in a data source',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        source_name: {
          type: 'string',
          description: 'Name of the data source',
        },
      },
      required: ['source_name'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/discovered-tables' } },
  },
  {
    name: 'quarri_propose_transformation',
    description: 'Propose a data transformation for extracted data',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table to transform',
        },
        transformation_type: {
          type: 'string',
          description: 'Type of transformation',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'quarri_upload_csv',
    description: 'Upload a CSV file to the database',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Path to the CSV file',
        },
        table_name: {
          type: 'string',
          description: 'Target table name',
        },
      },
      required: ['file_path', 'table_name'],
    },
  },
  {
    name: 'quarri_generate_quarri_schema',
    description: 'Generate Quarri schema configuration from database tables',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of table names to include',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_list_raw_tables',
    description: 'List raw/unprocessed tables in the database',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/raw-tables' } },
  },

  // ==================== DEBUG TOOLS ====================
  {
    name: 'quarri_read_server_logs',
    description: 'Read recent server logs for debugging',
    category: 'debug',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'integer',
          description: 'Number of log lines to read',
          default: 100,
        },
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warning', 'error'],
          description: 'Minimum log level to show',
        },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/logs-view' } },
  },
  {
    name: 'quarri_query_repl_activity',
    description: 'Query REPL agent activity history',
    category: 'debug',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'Filter by session ID',
        },
        limit: {
          type: 'integer',
          description: 'Maximum records to return',
          default: 50,
        },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/activity-list' } },
  },
  {
    name: 'quarri_read_fly_logs',
    description: 'Read production logs from Fly.io',
    category: 'debug',
    inputSchema: {
      type: 'object',
      properties: {
        lines: {
          type: 'integer',
          description: 'Number of log lines to read',
          default: 100,
        },
      },
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/logs-view' } },
  },

  // ==================== SESSION TOOLS (new for MCP) ====================
  {
    name: 'quarri_auth_status',
    description: 'Check authentication status - useful for debugging connection issues',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/auth-status' } },
  },
  {
    name: 'quarri_trial_status',
    description:
      'Check trial status, data usage, and upgrade information. Shows days remaining, data limits, and contact for upgrading to a full account.',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/trial-status' } },
  },
  {
    name: 'quarri_list_databases',
    description: 'List all databases the authenticated user has access to',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'quarri_select_database',
    description: 'Select the active database for subsequent queries',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {
        database_name: {
          type: 'string',
          description: 'Name of the database to select',
        },
      },
      required: ['database_name'],
    },
  },

  // ==================== CONNECTOR MANAGEMENT TOOLS ====================
  // These support the skills-first architecture for /quarri-debug-connector and /quarri-extract
  {
    name: 'quarri_log_analysis_run',
    description: 'Store a completed analysis run for history and auditing',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The analysis question that was asked',
        },
        sql_query: {
          type: 'string',
          description: 'The SQL query that was executed',
        },
        result_summary: {
          type: 'string',
          description: 'Summary of the analysis results',
        },
        row_count: {
          type: 'integer',
          description: 'Number of rows returned',
        },
        insights: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key insights generated',
        },
      },
      required: ['question', 'sql_query'],
    },
  },
  {
    name: 'quarri_schedule_extraction',
    description: 'Schedule a Python extraction job to run on Quarri infrastructure',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        source_name: {
          type: 'string',
          description: 'Name of the data source (e.g., "stripe", "hubspot")',
        },
        pipeline_code: {
          type: 'string',
          description: 'The validated dlt pipeline Python code',
        },
        schedule: {
          type: 'string',
          description: 'Cron expression for scheduling (e.g., "0 2 * * *" for daily at 2 AM)',
        },
        resources: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of resources/tables to extract',
        },
      },
      required: ['source_name', 'pipeline_code', 'schedule'],
    },
  },
  {
    name: 'quarri_store_generated_code',
    description: 'Save validated Python code for a connector or extraction pipeline',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        connector_id: {
          type: 'string',
          description: 'ID of the connector to update',
        },
        code: {
          type: 'string',
          description: 'The Python code to store',
        },
        code_type: {
          type: 'string',
          enum: ['extraction', 'transformation', 'connector'],
          description: 'Type of code being stored',
        },
        change_summary: {
          type: 'string',
          description: 'Summary of changes made to the code',
        },
      },
      required: ['connector_id', 'code', 'code_type'],
    },
  },
  {
    name: 'quarri_get_connector_code',
    description: 'Retrieve the Python source code for a connector (for debugging/healing)',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        connector_id: {
          type: 'string',
          description: 'ID of the connector',
        },
      },
      required: ['connector_id'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/code-view' } },
  },
  {
    name: 'quarri_get_connector_logs',
    description: 'Get execution logs and errors for a connector',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        connector_id: {
          type: 'string',
          description: 'ID of the connector',
        },
        lines: {
          type: 'integer',
          description: 'Number of log lines to retrieve',
          default: 100,
        },
        include_successful: {
          type: 'boolean',
          description: 'Include logs from successful runs (default: false, only show errors)',
          default: false,
        },
      },
      required: ['connector_id'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/logs-view' } },
  },
  {
    name: 'quarri_update_connector_code',
    description: 'Submit healed/updated code for a connector after local testing',
    category: 'connector',
    inputSchema: {
      type: 'object',
      properties: {
        connector_id: {
          type: 'string',
          description: 'ID of the connector to update',
        },
        pipeline_code: {
          type: 'string',
          description: 'The healed Python pipeline code',
        },
        change_summary: {
          type: 'string',
          description: 'Description of fixes applied',
        },
        test_results: {
          type: 'object',
          description: 'Results from local testing (row counts, validation results)',
        },
      },
      required: ['connector_id', 'pipeline_code', 'change_summary'],
    },
  },
];

/**
 * Get backend tool name from MCP tool name
 */
export function getBackendToolName(mcpToolName: string): string | null {
  return TOOL_NAME_MAP[mcpToolName] ?? null;
}

/**
 * Get tool definition by name
 */
export function getToolDefinition(name: string): ToolDefinition | undefined {
  return TOOL_DEFINITIONS.find((t) => t.name === name);
}
