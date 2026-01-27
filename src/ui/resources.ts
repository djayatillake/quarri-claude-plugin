/**
 * MCP UI Resources for Quarri
 * Defines interactive UI components rendered in Claude conversations
 */

export interface UIResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export const UI_RESOURCES: UIResource[] = [
  // Data resources
  {
    uri: 'ui://quarri/data-table',
    name: 'Data Table',
    description: 'Interactive data table for SQL results',
    mimeType: 'application/vnd.quarri.data-table+json',
  },
  {
    uri: 'ui://quarri/chart',
    name: 'Chart',
    description: 'Interactive Plotly chart',
    mimeType: 'application/vnd.quarri.chart+json',
  },
  {
    uri: 'ui://quarri/schema-explorer',
    name: 'Schema Explorer',
    description: 'Database schema visualization',
    mimeType: 'application/vnd.quarri.schema+json',
  },
  {
    uri: 'ui://quarri/search-results',
    name: 'Search Results',
    description: 'Value search results',
    mimeType: 'application/vnd.quarri.search-results+json',
  },
  {
    uri: 'ui://quarri/metrics-list',
    name: 'Metrics List',
    description: 'Defined metrics with status',
    mimeType: 'application/vnd.quarri.metrics-list+json',
  },
  {
    uri: 'ui://quarri/metric-detail',
    name: 'Metric Detail',
    description: 'Single metric details',
    mimeType: 'application/vnd.quarri.metric-detail+json',
  },

  // Session resources
  {
    uri: 'ui://quarri/auth-status',
    name: 'Auth Status',
    description: 'Authentication status',
    mimeType: 'application/vnd.quarri.auth-status+json',
  },
  {
    uri: 'ui://quarri/trial-status',
    name: 'Trial Status',
    description: 'Trial account status',
    mimeType: 'application/vnd.quarri.trial-status+json',
  },

  // Config resources
  {
    uri: 'ui://quarri/prompts-list',
    name: 'Prompts List',
    description: 'Agent prompts',
    mimeType: 'application/vnd.quarri.prompts-list+json',
  },
  {
    uri: 'ui://quarri/rules-list',
    name: 'Rules List',
    description: 'Query generation rules',
    mimeType: 'application/vnd.quarri.rules-list+json',
  },
  {
    uri: 'ui://quarri/columns-list',
    name: 'Columns List',
    description: 'Searchable columns',
    mimeType: 'application/vnd.quarri.columns-list+json',
  },

  // Team resources
  {
    uri: 'ui://quarri/teams-list',
    name: 'Teams List',
    description: 'Organization teams',
    mimeType: 'application/vnd.quarri.teams-list+json',
  },
  {
    uri: 'ui://quarri/team-filters',
    name: 'Team Filters',
    description: 'Row-level security filters',
    mimeType: 'application/vnd.quarri.team-filters+json',
  },
  {
    uri: 'ui://quarri/team-restrictions',
    name: 'Team Restrictions',
    description: 'Column restrictions',
    mimeType: 'application/vnd.quarri.team-restrictions+json',
  },

  // Extraction resources
  {
    uri: 'ui://quarri/sources-list',
    name: 'Sources List',
    description: 'Data extraction sources',
    mimeType: 'application/vnd.quarri.sources-list+json',
  },
  {
    uri: 'ui://quarri/discovered-tables',
    name: 'Discovered Tables',
    description: 'Tables in data source',
    mimeType: 'application/vnd.quarri.tables-list+json',
  },
  {
    uri: 'ui://quarri/raw-tables',
    name: 'Raw Tables',
    description: 'Unprocessed tables',
    mimeType: 'application/vnd.quarri.tables-list+json',
  },

  // Debug resources
  {
    uri: 'ui://quarri/logs-view',
    name: 'Logs View',
    description: 'Log entries',
    mimeType: 'application/vnd.quarri.logs-view+json',
  },
  {
    uri: 'ui://quarri/activity-list',
    name: 'Activity List',
    description: 'REPL activity timeline',
    mimeType: 'application/vnd.quarri.activity-list+json',
  },
  {
    uri: 'ui://quarri/code-view',
    name: 'Code View',
    description: 'Source code display',
    mimeType: 'application/vnd.quarri.code-view+json',
  },
];

// Tool to UI resource mapping
export const TOOL_UI_MAPPING: Record<string, string> = {
  // Data tools
  quarri_execute_sql: 'ui://quarri/data-table',
  quarri_get_schema: 'ui://quarri/schema-explorer',
  quarri_search_values: 'ui://quarri/search-results',
  quarri_get_metrics: 'ui://quarri/metrics-list',
  quarri_get_metric_detail: 'ui://quarri/metric-detail',
  quarri_search_metrics: 'ui://quarri/metrics-list',

  // Session tools
  quarri_auth_status: 'ui://quarri/auth-status',
  quarri_trial_status: 'ui://quarri/trial-status',

  // Configuration tools
  quarri_list_agent_prompts: 'ui://quarri/prompts-list',
  quarri_list_rules: 'ui://quarri/rules-list',
  quarri_list_searchable_columns: 'ui://quarri/columns-list',

  // Team tools
  quarri_list_teams: 'ui://quarri/teams-list',
  quarri_get_team_filters: 'ui://quarri/team-filters',
  quarri_get_team_restrictions: 'ui://quarri/team-restrictions',

  // Extraction tools
  quarri_list_extraction_sources: 'ui://quarri/sources-list',
  quarri_discover_tables: 'ui://quarri/discovered-tables',
  quarri_list_raw_tables: 'ui://quarri/raw-tables',

  // Debug tools
  quarri_read_server_logs: 'ui://quarri/logs-view',
  quarri_query_repl_activity: 'ui://quarri/activity-list',
  quarri_read_fly_logs: 'ui://quarri/logs-view',
  quarri_get_connector_logs: 'ui://quarri/logs-view',

  // Connector tools
  quarri_get_connector_code: 'ui://quarri/code-view',
};

// Get UI resource info for a tool
export function getToolUIResource(toolName: string): UIResource | undefined {
  const uri = TOOL_UI_MAPPING[toolName];
  if (!uri) return undefined;
  return UI_RESOURCES.find((r) => r.uri === uri);
}

// Render functions for each UI type

export function renderDataTable(
  rows: unknown[],
  columns: string[]
): Record<string, unknown> {
  return {
    type: 'data-table',
    columns: columns.map((c) => ({ key: c, label: c, sortable: true })),
    rows,
    pagination: rows.length > 50,
    pageSize: 50,
  };
}

export function renderChart(config: {
  data: object[];
  layout?: object;
  title?: string;
}): Record<string, unknown> {
  return {
    type: 'chart',
    plotly: { data: config.data, layout: config.layout || {} },
    title: config.title,
  };
}

export function renderSchemaExplorer(
  tables: Array<{ name: string; columns: Array<{ name: string; type: string }> }>
): Record<string, unknown> {
  return { type: 'schema-explorer', tables };
}

export function renderSearchResults(
  results: Array<{
    value: string;
    column: string;
    table: string;
    score?: number;
  }>
): Record<string, unknown> {
  return { type: 'search-results', results };
}

export function renderMetricsList(
  metrics: Array<{
    id: number;
    name: string;
    description: string;
    status: string;
  }>
): Record<string, unknown> {
  return { type: 'metrics-list', metrics };
}

export function renderMetricDetail(metric: {
  id: number;
  name: string;
  description: string;
  sql_template: string;
  dimensions?: string[];
  status: string;
}): Record<string, unknown> {
  return { type: 'metric-detail', ...metric };
}

export function renderAuthStatus(status: {
  authenticated: boolean;
  email?: string;
  role?: string;
  databases?: string[];
  expiresInDays?: number | string;
}): Record<string, unknown> {
  return { type: 'auth-status', ...status };
}

export function renderTrialStatus(status: {
  is_trial: boolean;
  days_remaining?: number;
  expires_at?: string;
  data_limit_gb?: number;
  organization?: string;
}): Record<string, unknown> {
  return { type: 'trial-status', ...status };
}

export function renderPromptsList(
  prompts: Array<{ agent_name: string; prompt: string }>
): Record<string, unknown> {
  return { type: 'prompts-list', prompts };
}

export function renderRulesList(
  rules: Array<{ id: number; rule_text: string; category?: string }>
): Record<string, unknown> {
  return { type: 'rules-list', rules };
}

export function renderColumnsList(
  columns: Array<{
    table_name: string;
    column_name: string;
    value_count?: number;
  }>
): Record<string, unknown> {
  return { type: 'columns-list', columns };
}

export function renderTeamsList(
  teams: Array<{ id: number; name: string; member_count?: number }>
): Record<string, unknown> {
  return { type: 'teams-list', teams };
}

export function renderTeamFilters(
  filters: Array<{ table_name: string; filter_expression: string }>
): Record<string, unknown> {
  return { type: 'team-filters', filters };
}

export function renderTeamRestrictions(
  restrictions: Array<{ table_name: string; hidden_columns: string[] }>
): Record<string, unknown> {
  return { type: 'team-restrictions', restrictions };
}

export function renderSourcesList(
  sources: Array<{
    name: string;
    type: string;
    status?: string;
    last_run?: string;
  }>
): Record<string, unknown> {
  return { type: 'sources-list', sources };
}

export function renderTablesList(
  tables: Array<{ name: string; row_count?: number; columns?: number }>
): Record<string, unknown> {
  return { type: 'tables-list', tables };
}

export function renderLogsView(
  logs: Array<{ timestamp: string; level: string; message: string }>
): Record<string, unknown> {
  return { type: 'logs-view', logs };
}

export function renderActivityList(
  activities: Array<{ timestamp: string; action: string; details?: string }>
): Record<string, unknown> {
  return { type: 'activity-list', activities };
}

export function renderCodeView(
  code: string,
  language: string = 'python'
): Record<string, unknown> {
  return { type: 'code-view', code, language };
}
