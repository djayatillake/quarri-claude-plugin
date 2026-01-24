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

export interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

// Map MCP tool names to backend tool names
export const TOOL_NAME_MAP: Record<string, string> = {
  // Sub-agents
  quarri_query_agent: 'query_agent',
  quarri_explain_agent: 'explain_agent',
  quarri_chart_agent: 'chart_agent',
  quarri_metric_builder_agent: 'metric_builder_agent',
  quarri_planning_agent: 'planning_agent',
  quarri_insight_agent: 'insight_agent',
  quarri_stats_agent: 'stats_agent',
  quarri_staging_agent: 'staging_agent',
  quarri_modeling_agent: 'modeling_agent',
  quarri_transformers_agent: 'transformers_agent',
  quarri_extraction_agent: 'extraction_agent',
  quarri_query_with_analysis: 'query_with_analysis',
  // Data
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
  // Canvas
  quarri_list_canvases: 'list_canvases',
  quarri_get_canvas: 'get_canvas',
  quarri_create_chart_panel: 'create_chart_panel',
  quarri_update_chart_panel: 'update_chart_panel',
  quarri_export_canvas: 'export_canvas',
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
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ==================== SUB-AGENT TOOLS ====================
  {
    name: 'quarri_query_agent',
    description:
      'Generate SQL from natural language questions. Use this when the user asks data questions.',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The natural language question to convert to SQL',
        },
        conversation_id: {
          type: 'integer',
          description: 'Optional conversation ID for multi-turn context',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'quarri_explain_agent',
    description: 'Explain SQL queries or query results in plain language',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The original question that was asked',
        },
        generated_sql: {
          type: 'string',
          description: 'The SQL query to explain',
        },
        error_message: {
          type: 'string',
          description: 'Error message if the query failed',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'quarri_chart_agent',
    description:
      'Generate chart configuration from query results. Returns Plotly chart spec.',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Column names from query results',
        },
        rows: {
          type: 'array',
          items: { type: 'object' },
          description: 'Data rows from query results',
        },
        question: {
          type: 'string',
          description: 'The original question for context',
        },
        sql_query: {
          type: 'string',
          description: 'The SQL query that produced the data',
        },
      },
      required: ['columns', 'rows'],
    },
  },
  {
    name: 'quarri_metric_builder_agent',
    description:
      'Help define new metrics through a 3-step conversational process',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'User message about metrics they want to define',
        },
        conversation_id: {
          type: 'integer',
          description: 'Conversation ID for multi-turn metric building',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'quarri_planning_agent',
    description:
      'Create detailed analysis plans for complex questions. Use for multi-step analysis.',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        analysis_request: {
          type: 'string',
          description: 'The analysis question or request',
        },
        mode: {
          type: 'string',
          enum: ['create', 'revise'],
          description: 'Whether to create new plan or revise existing',
        },
        existing_plan: {
          type: 'string',
          description: 'Existing plan to revise (for revise mode)',
        },
        feedback: {
          type: 'string',
          description: 'User feedback for plan revision',
        },
      },
      required: ['analysis_request'],
    },
  },
  {
    name: 'quarri_query_with_analysis',
    description: `Run a complete analysis pipeline for a question:
1. Query Agent - generates SQL from the question
2. Execute SQL - runs the query and gets results
3. Stats Agent - performs statistical analysis, decides if chart is needed
4. Chart Agent - generates visualization (if recommended)
5. Insight Agent - generates key findings and recommendations

Use this tool for data questions that would benefit from full analysis.
Returns SQL, data, statistics, optional chart config, and insights.`,
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The data question to analyze',
        },
        include_chart: {
          type: 'boolean',
          description:
            'Whether to generate a chart (default: let stats agent decide)',
        },
      },
      required: ['question'],
    },
  },
  {
    name: 'quarri_insight_agent',
    description: 'Generate actionable insights from statistical analysis results',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The analysis question',
        },
        statistical_results: {
          type: 'array',
          items: { type: 'object' },
          description: 'Results from stats_agent analysis',
        },
        sql_query: {
          type: 'string',
          description: 'The query that produced the data',
        },
      },
      required: ['question', 'statistical_results'],
    },
  },
  {
    name: 'quarri_stats_agent',
    description: 'Perform intelligent statistical analysis on query results',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description: 'The analysis question',
        },
        data: {
          type: 'array',
          items: { type: 'object' },
          description: 'Data rows to analyze',
        },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Column names',
        },
      },
      required: ['question', 'data', 'columns'],
    },
  },
  {
    name: 'quarri_staging_agent',
    description:
      'Propose staging transformations for raw tables (deduplication, PII handling, type casting)',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Source table name to stage',
        },
        schema_name: {
          type: 'string',
          description: 'Schema containing the table',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'quarri_modeling_agent',
    description:
      'Plan silver layer data models (fact/dimension classification, relationships)',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        staging_tables: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of staging table names to model',
        },
      },
      required: ['staging_tables'],
    },
  },
  {
    name: 'quarri_transformers_agent',
    description:
      'Generate SQL CREATE VIEW statements for dimensional model from a model plan',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        model_plan: {
          type: 'object',
          description:
            'Model plan from modeling_agent with facts, dimensions, relationships',
        },
      },
      required: ['model_plan'],
    },
  },
  {
    name: 'quarri_extraction_agent',
    description: 'Generate dlt pipeline code for data extraction from APIs',
    category: 'sub_agent',
    inputSchema: {
      type: 'object',
      properties: {
        source_name: {
          type: 'string',
          description: 'Data source name (e.g., "stripe", "hubspot")',
        },
        source_category: {
          type: 'string',
          description: 'Source category (e.g., "payments", "crm", "custom")',
        },
        selected_resources: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of tables/endpoints to extract',
        },
      },
      required: ['source_name'],
    },
  },

  // ==================== DATA TOOLS ====================
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
  },

  // ==================== CANVAS TOOLS ====================
  {
    name: 'quarri_list_canvases',
    description: 'List all canvas workspaces',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'quarri_get_canvas',
    description: 'Get a specific canvas with all its panels',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        canvas_id: {
          type: 'integer',
          description: 'ID of the canvas',
        },
      },
      required: ['canvas_id'],
    },
  },
  {
    name: 'quarri_create_chart_panel',
    description: 'Create a new chart panel on a canvas',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        canvas_id: {
          type: 'integer',
          description: 'ID of the canvas',
        },
        title: {
          type: 'string',
          description: 'Panel title',
        },
        sql_query: {
          type: 'string',
          description: 'SQL query for the chart data',
        },
        chart_config: {
          type: 'object',
          description: 'Plotly chart configuration',
        },
      },
      required: ['canvas_id', 'title', 'sql_query', 'chart_config'],
    },
  },
  {
    name: 'quarri_update_chart_panel',
    description: 'Update an existing chart panel',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        panel_id: {
          type: 'integer',
          description: 'ID of the panel to update',
        },
        title: {
          type: 'string',
          description: 'New panel title',
        },
        sql_query: {
          type: 'string',
          description: 'New SQL query',
        },
        chart_config: {
          type: 'object',
          description: 'New chart configuration',
        },
      },
      required: ['panel_id'],
    },
  },
  {
    name: 'quarri_export_canvas',
    description: 'Export a canvas to PDF or image',
    category: 'canvas',
    inputSchema: {
      type: 'object',
      properties: {
        canvas_id: {
          type: 'integer',
          description: 'ID of the canvas to export',
        },
        format: {
          type: 'string',
          enum: ['pdf', 'png'],
          description: 'Export format',
        },
      },
      required: ['canvas_id', 'format'],
    },
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
