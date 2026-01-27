# Quarri Claude Plugin

Natural language data analysis with Quarri. Query databases, create visualizations, and get insights using plain English.

## Installation

### Claude Code

```bash
claude /install quarri
```

Or manually add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "quarri": {
      "command": "npx",
      "args": ["@quarri/claude-data-tools"]
    }
  }
}
```

### Claude Desktop

1. **Authenticate first** (one-time setup):

```bash
# New users - create a free trial account
npx @quarri/claude-data-tools signup

# Existing users - log in
npx @quarri/claude-data-tools auth
```

2. **Add to Claude Desktop config**:

   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quarri": {
      "command": "npx",
      "args": ["@quarri/claude-data-tools"]
    }
  }
}
```

3. **Restart Claude Desktop**

## Authentication

### New Users

Create a free trial account:

```bash
npx @quarri/claude-data-tools signup
```

You'll receive a verification email to complete signup.

### Existing Users

```bash
npx @quarri/claude-data-tools auth
```

1. Enter your email address
2. Check your email for a 6-digit verification code
3. Enter the code to complete authentication

Credentials are stored securely in `~/.quarri/credentials`.

## Features

### Interactive UI Components (MCP Apps)

Quarri returns rich, interactive UI components for data display:

- **Data Tables** - Sortable, paginated query results
- **Charts** - Interactive Plotly visualizations
- **Schema Explorer** - Visual database structure
- **Metrics Cards** - KPI displays with status badges
- **Logs View** - Syntax-highlighted log entries
- **Code View** - Syntax-highlighted source code

These render automatically in Claude Desktop and Claude Code when using supported tools.

### 39 Tools for Data Analysis

**Data Tools:**
- `quarri_execute_sql` - Run SQL queries → interactive data table
- `quarri_get_schema` - View database schema → schema explorer
- `quarri_search_values` - Semantic search → search results
- `quarri_get_metrics` - List defined metrics → metrics list
- `quarri_create_metric` - Define new metrics
- `quarri_approve_metric` - Approve pending metrics
- `quarri_get_metric_detail` - Metric details → metric card
- `quarri_search_metrics` - Search metrics → metrics list

**Configuration:**
- `quarri_list_agent_prompts` - View agent prompts → prompts list
- `quarri_update_agent_prompt` - Update prompts
- `quarri_list_rules` - Query generation rules → rules list
- `quarri_create_rule`, `quarri_update_rule`, `quarri_delete_rule`
- `quarri_vectorize_column_values` - Enable semantic search
- `quarri_list_searchable_columns` - View searchable columns → columns list

**Team & Security:**
- `quarri_list_teams` - Organization teams → teams list
- `quarri_get_team_filters` - Row-level security → filters view
- `quarri_get_team_restrictions` - Column restrictions → restrictions view

**Data Extraction:**
- `quarri_list_extraction_sources` - Data sources → sources list
- `quarri_configure_extraction` - Configure sources
- `quarri_discover_tables` - Discover tables → tables list
- `quarri_propose_transformation` - Propose transforms
- `quarri_upload_csv` - Upload CSV files
- `quarri_generate_quarri_schema` - Generate schema config
- `quarri_list_raw_tables` - Raw tables → tables list

**Connectors:**
- `quarri_get_connector_code` - View connector code → code view
- `quarri_get_connector_logs` - Connector logs → logs view
- `quarri_log_analysis_run` - Log analysis runs
- `quarri_schedule_extraction` - Schedule extractions
- `quarri_store_generated_code` - Save connector code
- `quarri_update_connector_code` - Update connector code

**Debug:**
- `quarri_read_server_logs` - Server logs → logs view
- `quarri_query_repl_activity` - Activity history → activity list
- `quarri_read_fly_logs` - Production logs → logs view

**Session:**
- `quarri_auth_status` - Check auth → auth status card
- `quarri_trial_status` - Trial info → trial status card
- `quarri_list_databases` - Available databases
- `quarri_select_database` - Switch database

### Skills (Slash Commands)

Quarri includes intelligent skills for common workflows:

- `/quarri-query` - Natural language to SQL
- `/quarri-analyze` - Full analysis pipeline
- `/quarri-chart` - Generate visualizations
- `/quarri-insights` - Statistical insights
- `/quarri-metric` - Define metrics interactively
- `/quarri-explain` - Explain SQL queries
- `/quarri-extract` - Create data pipelines
- `/quarri-diagnose` - Debug connector issues
- `/quarri-guide` - Quarri usage guide

## Usage Examples

### Ask a Data Question

```
What were our top 10 products by revenue last month?
```

Claude will generate SQL, execute it, and return results in an interactive data table.

### Create a Visualization

```
/quarri-chart Show monthly revenue trend for 2024
```

Returns an interactive Plotly chart rendered in the conversation.

### Define a Metric

```
/quarri-metric Help me define customer lifetime value
```

Guides you through defining a reusable metric with SQL template.

### Configure Semantic Search

```
Enable semantic search on the product_name column
```

Uses `quarri_vectorize_column_values` to enable natural language search on column values.

## Environment Variables

- `QUARRI_API_URL` - API endpoint (default: https://app.quarri.ai)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Local development
npm run dev
```

## Support

- GitHub Issues: https://github.com/djayatillake/quarri-claude-plugin/issues
- Documentation: https://docs.quarri.ai
- Email: support@quarri.ai

## License

MIT
