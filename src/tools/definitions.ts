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
  // Query context (bundles schema, rules, metrics, searchable columns)
  quarri_get_query_context: 'get_query_context',
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
  // Direct Schema Management
  quarri_execute_ddl: 'execute_ddl',
  quarri_execute_dml: 'execute_dml',
  quarri_query_model_data: 'query_model_data',
  // Staging/Silver Pipeline (metadata-aware)
  quarri_list_staging_tables: 'list_staging_tables',
  quarri_introspect_table: 'introspect_table',
  quarri_execute_staging_view: 'execute_staging_view',
  quarri_execute_silver_view: 'execute_silver_view',
  quarri_register_transformation: 'register_transformation',
  quarri_get_staging_lineage: 'get_staging_lineage',
  quarri_refresh_schema: 'refresh_schema',
  quarri_save_model_plan: 'save_model_plan',
  // Relationship Management
  quarri_detect_relationships: 'detect_relationships',
  quarri_set_relationship: 'set_relationship',
  quarri_get_relationships: 'get_relationships',
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
  // Environment management
  quarri_create_environment: 'create_environment',
  quarri_list_environments: 'list_environments',
  quarri_delete_environment: 'delete_environment',
  quarri_promote_environment: 'promote_environment',
  quarri_rollback_production: 'rollback_production',
  quarri_list_production_snapshots: 'list_production_snapshots',
  // Skills (procedural knowledge)
  quarri_create_skill: 'create_skill',
  quarri_search_skills: 'search_skills',
  quarri_list_skills: 'list_skills',
  quarri_get_skill: 'get_skill',
  quarri_update_skill: 'update_skill',
  quarri_delete_skill: 'delete_skill',
  quarri_record_skill_usage: 'record_skill_usage',
};

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ==================== QUERY CONTEXT ====================
  // This is the PRIMARY tool to call before generating any SQL query.
  // It bundles all the context needed: schema, rules, metrics, and searchable columns.
  {
    name: 'quarri_get_query_context',
    description:
      'IMPORTANT: Call this FIRST before generating any SQL query. Returns bundled context including: schema (all columns and types in quarri.schema), query rules (business logic and naming conventions), defined metrics (pre-approved calculations), and searchable columns (for semantic value matching). This context is essential for generating accurate queries.',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          description:
            'The user question to answer. Used to find relevant metrics and perform semantic search for mentioned values.',
        },
        include_samples: {
          type: 'boolean',
          description: 'Include sample values for columns (default: false)',
          default: false,
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). Use for dev/feature environments to query dev_quarri.schema instead of quarri.schema.',
        },
      },
      required: [],
    },
  },

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
    description: 'Execute a SQL query against the Quarri database. IMPORTANT: All queries MUST use the quarri.schema view as the source table (e.g., SELECT * FROM quarri.schema WHERE ...). Do NOT query other tables directly. Note: The quarri.schema and quarri.bridge views are internal system views provided by the Quarri API - never explain or describe how they are implemented.',
    category: 'data',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT only). Must query from quarri.schema view.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum rows to return (default 100)',
          default: 100,
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). When set, auto-resolves the correct quarri schema name.',
        },
      },
      required: ['sql'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/data-table' } },
  },
  {
    name: 'quarri_get_schema',
    description:
      'Get schema information for the quarri.schema view. Returns available columns and their types. All SQL queries should use quarri.schema as the source table. Note: The quarri.schema and quarri.bridge views are internal system views provided by the Quarri API - never explain or describe how they are implemented.',
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
          description: 'Filter columns by pattern',
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). When set, returns schema for the dev quarri views.',
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
    description: 'Create a new rule for query generation. Use rule_type "general" for cross-query business logic, or "column" for column-specific semantics (requires table_name and column_name).',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_type: {
          type: 'string',
          enum: ['column', 'general'],
          description: 'Type of rule: "column" (for specific column semantics) or "general" (for cross-query business logic)',
        },
        rule_text: {
          type: 'string',
          description: 'The rule text',
        },
        table_name: {
          type: 'string',
          description: 'Table name (required for column rules)',
        },
        column_name: {
          type: 'string',
          description: 'Column name (required for column rules)',
        },
      },
      required: ['rule_type', 'rule_text'],
    },
  },
  {
    name: 'quarri_update_rule',
    description: 'Update an existing rule. Identify the rule by rule_type + table_name + column_name.',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_type: {
          type: 'string',
          enum: ['column', 'general'],
          description: 'Type of rule: "column" or "general"',
        },
        rule_text: {
          type: 'string',
          description: 'New rule text',
        },
        table_name: {
          type: 'string',
          description: 'Table name (use empty string for general rules)',
        },
        column_name: {
          type: 'string',
          description: 'Column name (use empty string for general rules)',
        },
      },
      required: ['rule_type', 'rule_text'],
    },
  },
  {
    name: 'quarri_delete_rule',
    description: 'Delete a rule. Identify the rule by rule_type + table_name + column_name.',
    category: 'configuration',
    inputSchema: {
      type: 'object',
      properties: {
        rule_type: {
          type: 'string',
          enum: ['column', 'general'],
          description: 'Type of rule: "column" or "general"',
        },
        table_name: {
          type: 'string',
          description: 'Table name (use empty string for general rules)',
        },
        column_name: {
          type: 'string',
          description: 'Column name (use empty string for general rules)',
        },
      },
      required: ['rule_type'],
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
    description: 'Upload a CSV file to permanently create a raw.{table_name} table in the database. WARNING: This creates permanent tables — it is for adding new data sources to the data model, NOT for temporary tasks like reconciliation, comparison, or verification. For comparing external data against Quarri data, use quarri_execute_sql to extract data and process locally with Python.',
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
    description: 'Generate Quarri schema configuration from database tables. This permanently modifies the quarri.schema and quarri.bridge views. Only use when adding tables to the data model permanently. Do NOT use for temporary or ad-hoc data.',
    category: 'extraction',
    inputSchema: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of table names to include',
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). Generates quarri schema in the environment-specific schemas.',
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

  // ==================== DIRECT SCHEMA MANAGEMENT TOOLS ====================
  {
    name: 'quarri_execute_ddl',
    description:
      'Execute a DDL statement (CREATE, ALTER, DROP) against staging, silver, or main schemas. REQUIRES a development environment — production is protected and can only be modified via promote_environment. One statement per call. Admin only. For creating staging/silver views, prefer execute_staging_view or execute_silver_view which also save metadata. Use execute_ddl for reference tables (CREATE TABLE), ALTER TABLE, DROP operations.',
    category: 'schema_management',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description:
            'DDL statement (CREATE TABLE/VIEW, ALTER TABLE/VIEW, DROP TABLE/VIEW)',
        },
        description: {
          type: 'string',
          description: 'Audit description of what this DDL does',
        },
        environment: {
          type: 'string',
          description:
            'REQUIRED. Target development environment name (e.g. "dev"). Production is protected — use promote_environment to deploy changes.',
        },
      },
      required: ['sql', 'environment'],
    },
  },
  {
    name: 'quarri_execute_dml',
    description:
      'Execute a DML statement (INSERT, UPDATE, DELETE) against staging, silver, or main schemas. REQUIRES a development environment — production is protected and can only be modified via promote_environment. For populating reference tables, fixing data, etc. Admin only.',
    category: 'schema_management',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'DML statement (INSERT INTO, UPDATE, DELETE FROM)',
        },
        description: {
          type: 'string',
          description: 'Audit description of what this DML does',
        },
        environment: {
          type: 'string',
          description:
            'REQUIRED. Target development environment name (e.g. "dev"). Production is protected — use promote_environment to deploy changes.',
        },
      },
      required: ['sql', 'environment'],
    },
  },
  {
    name: 'quarri_query_model_data',
    description:
      'Execute a SELECT query against any schema (staging, silver, main, raw). Unlike quarri_execute_sql (which uses quarri.schema), this queries underlying tables directly. Use for schema management work: inspecting staging data, verifying views, checking reference tables.',
    category: 'schema_management',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description:
            'SELECT query to execute against staging/silver/main/raw tables',
        },
        limit: {
          type: 'integer',
          description: 'Maximum rows to return (default 100)',
          default: 100,
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). Allows querying environment-specific schemas.',
        },
      },
      required: ['sql'],
    },
    _meta: { ui: { resourceUri: 'ui://quarri/data-table' } },
  },

  // ==================== STAGING/SILVER MODEL TOOLS ====================
  {
    name: 'quarri_list_staging_tables',
    description:
      'List available staging tables with their introspection metadata (row counts, columns, PII detection status)',
    category: 'staging',
    inputSchema: {
      type: 'object',
      properties: {
        schema_name: {
          type: 'string',
          description: 'Schema to list tables from (default: staging)',
        },
        include_introspection: {
          type: 'boolean',
          description:
            'Include cached introspection metadata if available (default: true)',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_introspect_table',
    description:
      'Deep column analysis of a specific table. Returns: column statistics (cardinality, nulls, distinct values), PII detection results, primary key candidates with confidence scores, type casting recommendations, and sample values. Use before creating staging views or reference tables.',
    category: 'staging',
    inputSchema: {
      type: 'object',
      properties: {
        schema_name: {
          type: 'string',
          description: 'Schema containing the table (default: raw)',
        },
        table_name: {
          type: 'string',
          description: 'Table name to introspect',
        },
        force_refresh: {
          type: 'boolean',
          description: 'Bypass cache and re-run introspection (default: false)',
        },
      },
      required: ['table_name'],
    },
  },

  // ==================== STAGING/SILVER PIPELINE (metadata-aware) ====================
  {
    name: 'quarri_execute_staging_view',
    description:
      'Create a staging view in MotherDuck AND register it in the metadata pipeline. REQUIRES a development environment — production is protected and can only be modified via promote_environment. Preferred over execute_ddl for staging views — saves transformation_definition to Postgres so the web app can track lineage. Always write SQL using production schema names (staging.X, silver.X, main.X) — schema references are auto-rewritten to target the correct environment schemas (e.g. staging.X → dev_staging.X). Do NOT use for temporary or ad-hoc analysis — staging views are permanent data model changes.',
    category: 'staging',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'CREATE VIEW SQL for the staging view',
        },
        source_table: {
          type: 'string',
          description: 'Source table name (e.g. "raw_orders")',
        },
        target_view: {
          type: 'string',
          description: 'Target view name (e.g. "staging.stg_orders")',
        },
        source_schema: {
          type: 'string',
          description: 'Source schema (default: raw)',
        },
        rationale: {
          type: 'string',
          description: 'Why this transformation was made',
        },
        field_metadata: {
          type: 'object',
          description: 'Column mappings and other metadata',
        },
        environment: {
          type: 'string',
          description:
            'REQUIRED. Target development environment name (e.g. "dev"). Production is protected — use promote_environment to deploy changes.',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'quarri_execute_silver_view',
    description:
      'Create a silver/main view in MotherDuck AND register it in the metadata pipeline. REQUIRES a development environment — production is protected and can only be modified via promote_environment. Preferred over execute_ddl for silver views. After creating views, use detect_relationships + set_relationship before generate_quarri_schema. Always write SQL using production schema names (silver.X, main.X, staging.X) — schema references are auto-rewritten to target the correct environment schemas (e.g. silver.X → dev_silver.X, main.X → dev_main.X). Do NOT use for temporary or ad-hoc analysis — silver views are permanent data model changes.',
    category: 'silver',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'CREATE VIEW SQL for the silver/main view',
        },
        source_table: {
          type: 'string',
          description: 'Source table for lineage (e.g. "staging.stg_tickets")',
        },
        target_view: {
          type: 'string',
          description: 'Target view for lineage (e.g. "silver.dim_products" or "main.fact_sales")',
        },
        source_schema: {
          type: 'string',
          description: 'Source schema (default: staging)',
        },
        target_schema: {
          type: 'string',
          description: 'Target schema (default: silver)',
        },
        rationale: {
          type: 'string',
          description: 'Why this transformation was made',
        },
        field_metadata: {
          type: 'object',
          description: 'Column mappings and other metadata',
        },
        environment: {
          type: 'string',
          description:
            'REQUIRED. Target development environment name (e.g. "dev"). Production is protected — use promote_environment to deploy changes.',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'quarri_register_transformation',
    description:
      'Register a transformation in the metadata pipeline without creating views. Use after execute_ddl to retroactively add lineage tracking. Pure metadata operation — no DDL is executed.',
    category: 'staging',
    inputSchema: {
      type: 'object',
      properties: {
        source_schema: {
          type: 'string',
          description: 'Source schema (e.g. "raw")',
        },
        source_table: {
          type: 'string',
          description: 'Source table name',
        },
        target_schema: {
          type: 'string',
          description: 'Target schema (e.g. "staging" or "silver")',
        },
        target_view: {
          type: 'string',
          description: 'Target view name',
        },
        transformation_type: {
          type: 'string',
          description: 'Type: "staging" or "silver"',
          enum: ['staging', 'silver'],
        },
        sql_definition: {
          type: 'string',
          description: 'The SQL CREATE VIEW statement',
        },
        rationale: {
          type: 'string',
          description: 'Why this transformation was made',
        },
        field_metadata: {
          type: 'object',
          description: 'Column mappings and other metadata',
        },
        environment: {
          type: 'string',
          description: 'Target environment (default: "production").',
        },
      },
      required: ['source_schema', 'source_table', 'target_schema', 'target_view', 'transformation_type'],
    },
  },
  {
    name: 'quarri_get_staging_lineage',
    description:
      'Get raw->staging->silver lineage. Shows what transformations exist and their source/target relationships.',
    category: 'staging',
    inputSchema: {
      type: 'object',
      properties: {
        transformation_type: {
          type: 'string',
          description: 'Filter by type: "staging", "silver", or "all" (default: "all")',
          enum: ['staging', 'silver', 'all'],
        },
        environment: {
          type: 'string',
          description: 'Target environment (default: "production"). Filters lineage by environment.',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_refresh_schema',
    description:
      'Refresh Postgres cache from MotherDuck so web app sees current tables/columns. Call after DDL changes or generate_quarri_schema.',
    category: 'schema_management',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'quarri_save_model_plan',
    description:
      'Save a dimensional model plan to Postgres so the web app can display it. Saves primary keys, table types (fact/dimension), and relationships.',
    category: 'silver',
    inputSchema: {
      type: 'object',
      properties: {
        model_plan: {
          type: 'object',
          description: 'Model plan with facts, dimensions, and relationships arrays',
        },
        environment: {
          type: 'string',
          description: 'Target environment (default: "production").',
        },
      },
      required: ['model_plan'],
    },
  },

  // ==================== RELATIONSHIP MANAGEMENT TOOLS ====================
  {
    name: 'quarri_detect_relationships',
    description:
      'Analyze tables and detect FK relationships using column naming patterns, data validation, and cardinality analysis. Returns proposed relationships with confidence scores.',
    category: 'relationships',
    inputSchema: {
      type: 'object',
      properties: {
        schema_name: {
          type: 'string',
          description: 'Schema to analyze (default: silver)',
        },
        tables: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Specific tables to analyze (optional - defaults to all tables in schema)',
        },
        environment: {
          type: 'string',
          description:
            'Target environment (default: "production"). Analyzes environment-specific main schema.',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_set_relationship',
    description:
      'Set a foreign key relationship between two tables. Stored in metadata for USS view generation.',
    category: 'relationships',
    inputSchema: {
      type: 'object',
      properties: {
        from_table: {
          type: 'string',
          description: 'Source table (the one with FK)',
        },
        from_column: {
          type: 'string',
          description: 'FK column in source table',
        },
        to_table: {
          type: 'string',
          description: 'Target table (the one with PK)',
        },
        to_column: {
          type: 'string',
          description: 'PK column in target table',
        },
        relationship_type: {
          type: 'string',
          enum: ['many-to-one', 'one-to-one'],
          description: 'Type of relationship (default: many-to-one)',
        },
        environment: {
          type: 'string',
          description: 'Target environment (default: "production").',
        },
      },
      required: ['from_table', 'from_column', 'to_table', 'to_column'],
    },
  },
  {
    name: 'quarri_get_relationships',
    description:
      'Get current relationships stored in metadata. Returns relationships as a list and generates a Mermaid ERD diagram.',
    category: 'relationships',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['list', 'mermaid', 'both'],
          description: 'Output format (default: both)',
        },
        environment: {
          type: 'string',
          description: 'Target environment (default: "production"). Filters relationships by environment.',
        },
      },
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

  // ==================== RE-AUTHENTICATION TOOLS ====================
  {
    name: 'quarri_request_reauth',
    description:
      'Request a verification code for re-authentication when your Quarri session has expired. Sends a 6-digit code to the email associated with the expired session. After calling this, ask the user for the code and use quarri_complete_reauth to finish.',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description:
            'Email address to send verification code to. Optional — auto-detected from expired credentials if available.',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_complete_reauth',
    description:
      'Complete re-authentication with the verification code from the user\'s email. Saves new credentials and restores the session.',
    category: 'session',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'Email address used for re-authentication',
        },
        code: {
          type: 'string',
          description: '6-digit verification code from email',
        },
      },
      required: ['email', 'code'],
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

  // ==================== SKILLS TOOLS ====================
  {
    name: 'quarri_create_skill',
    description:
      'Save a skill (procedural knowledge) after completing a complex workflow. Call this after successfully completing a multi-step task — setting up data pipelines, debugging connectors, building dimensional models, custom analysis patterns. The skill captures the procedure so future sessions can replicate it.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        skill_name: {
          type: 'string',
          description: 'Short, descriptive name (e.g., "Stripe staging-to-silver pipeline")',
        },
        category: {
          type: 'string',
          description: 'Skill category',
          enum: ['pipeline', 'analysis', 'modeling', 'debugging', 'extraction', 'general'],
        },
        description: {
          type: 'string',
          description: 'Short summary of what this skill does (1-2 sentences)',
        },
        steps: {
          type: 'string',
          description:
            'Markdown procedure — the step-by-step instructions to replicate this workflow',
        },
        prerequisites: {
          type: 'string',
          description:
            'What must be true before starting (e.g., "Raw Stripe tables must exist in staging")',
        },
        example_context: {
          type: 'string',
          description:
            'When to use this skill (e.g., "When a customer asks to set up Stripe data")',
        },
        tags: {
          type: 'array',
          description: 'Discovery tags (e.g., ["stripe", "staging", "silver"])',
          items: { type: 'string' },
        },
        related_tools: {
          type: 'array',
          description:
            'MCP tool names used in this skill (e.g., ["execute_staging_view", "execute_silver_view"])',
          items: { type: 'string' },
        },
      },
      required: ['skill_name', 'category', 'description', 'steps'],
    },
  },
  {
    name: 'quarri_search_skills',
    description:
      'Search for relevant skills by text query and/or tags. Use when starting a complex task to check if a saved procedure exists.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search text (matched against name, description, steps, and tags)',
        },
        category: {
          type: 'string',
          description: 'Optional category filter',
          enum: ['pipeline', 'analysis', 'modeling', 'debugging', 'extraction', 'general'],
        },
        tags: {
          type: 'array',
          description: 'Optional tag filter (matches any overlap)',
          items: { type: 'string' },
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'quarri_list_skills',
    description: 'List all saved skills for this database, optionally filtered by category.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional category filter',
          enum: ['pipeline', 'analysis', 'modeling', 'debugging', 'extraction', 'general'],
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_get_skill',
    description:
      'Get full skill details including step-by-step procedure. Use after search/list to retrieve the complete skill.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'integer',
          description: 'ID of the skill',
        },
        skill_name: {
          type: 'string',
          description: 'Name of the skill (alternative to skill_id)',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_update_skill',
    description:
      "Update a skill's content or metadata. Use to refine steps, fix errors, or update tags.",
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'integer',
          description: 'ID of the skill to update',
        },
        updates: {
          type: 'object',
          description:
            'Fields to update. Allowed: skill_name, category, description, steps, prerequisites, example_context, tags, related_tools',
        },
      },
      required: ['skill_id', 'updates'],
    },
  },
  {
    name: 'quarri_delete_skill',
    description:
      'Deactivate a skill (soft delete). The skill will no longer appear in search or list results.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'integer',
          description: 'ID of the skill to delete',
        },
      },
      required: ['skill_id'],
    },
  },
  {
    name: 'quarri_record_skill_usage',
    description:
      'Record that a skill was followed, and whether it led to success. Call after using a skill to complete a task.',
    category: 'skills',
    inputSchema: {
      type: 'object',
      properties: {
        skill_id: {
          type: 'integer',
          description: 'ID of the skill that was used',
        },
        success: {
          type: 'boolean',
          description: 'Whether following the skill led to a successful outcome',
        },
      },
      required: ['skill_id', 'success'],
    },
  },

  // ==================== ENVIRONMENT MANAGEMENT ====================
  {
    name: 'quarri_create_environment',
    description:
      'Create a new development environment with isolated schemas. Creates 3 MotherDuck schemas (e.g. dev_staging, dev_main, dev_quarri) and copies all production staging/silver views, relationships, and primary keys so you start with a working copy of prod. Raw data is shared across all environments.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {
        environment_name: {
          type: 'string',
          description:
            'Environment name (e.g. "dev", "feature-x"). Will be sanitized (hyphens to underscores). Cannot be "production".',
        },
        display_name: {
          type: 'string',
          description: 'Human-friendly display name (optional, defaults to environment_name)',
        },
      },
      required: ['environment_name'],
    },
  },
  {
    name: 'quarri_list_environments',
    description:
      'List all environments for the current database. Always includes the virtual "production" entry plus any dev/feature environments.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'quarri_delete_environment',
    description:
      'Delete a development environment. Drops all 3 MotherDuck schemas (CASCADE) and removes metadata. Cannot delete production.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {
        environment_name: {
          type: 'string',
          description: 'Environment to delete (cannot be "production")',
        },
      },
      required: ['environment_name'],
    },
  },
  {
    name: 'quarri_promote_environment',
    description:
      'Promote a development environment to production. Rewrites SQL schema references, executes views in production schemas (staging first, then main), copies relationships/primary_keys, regenerates quarri.schema, and refreshes caches. Automatically creates a production snapshot before promoting for rollback safety.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {
        environment_name: {
          type: 'string',
          description: 'Environment to promote (cannot be "production")',
        },
      },
      required: ['environment_name'],
    },
  },
  {
    name: 'quarri_rollback_production',
    description:
      'Rollback production to a previous snapshot. Restores transformation definitions, relationships, and primary keys from a snapshot. Re-executes all staging and silver views in production schemas and regenerates quarri schema. If no snapshot_id is provided, rolls back to the most recent snapshot.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {
        snapshot_id: {
          type: 'integer',
          description:
            'ID of the snapshot to rollback to (optional — defaults to most recent)',
        },
      },
      required: [],
    },
  },
  {
    name: 'quarri_list_production_snapshots',
    description:
      'List available production snapshots for rollback. Shows timestamp, trigger (manual/pre_promote), and definition counts.',
    category: 'environments',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Max number of snapshots to return (default 20)',
        },
      },
      required: [],
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
