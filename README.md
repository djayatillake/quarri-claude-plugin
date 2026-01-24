# Quarri Claude Code Plugin

Natural language data analysis with Quarri. Query databases, create visualizations, and get insights using plain English.

## Installation

### Via Claude Code Marketplace

```bash
claude /install quarri
```

### Manual Installation

```bash
npm install -g @quarri/claude-data-tools
```

Then add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "quarri": {
      "command": "quarri-mcp"
    }
  }
}
```

## Authentication

On first use, you'll be prompted to authenticate:

### Existing Quarri Users

1. Enter your email address
2. Check your email for a 6-digit verification code
3. Enter the code to complete authentication

### New Users (with invitation)

1. Select "invite" when prompted
2. Enter your email address
3. Enter the invitation token from your admin's email
4. Your account will be created automatically

## Features

### 47 Tools for Data Analysis

**Sub-Agents (12):**
- `quarri_query_agent` - Generate SQL from natural language
- `quarri_explain_agent` - Explain SQL queries
- `quarri_chart_agent` - Generate visualizations
- `quarri_metric_builder_agent` - Define metrics interactively
- `quarri_planning_agent` - Create analysis plans
- `quarri_insight_agent` - Generate actionable insights
- `quarri_stats_agent` - Statistical analysis
- `quarri_staging_agent` - Stage raw data
- `quarri_modeling_agent` - Design data models
- `quarri_transformers_agent` - Generate transformation SQL
- `quarri_extraction_agent` - Create data pipelines
- `quarri_query_with_analysis` - Full analysis pipeline

**Data Tools (8):**
- `quarri_execute_sql` - Run SQL queries
- `quarri_get_schema` - View database schema
- `quarri_search_values` - Semantic search
- `quarri_get_metrics`, `quarri_create_metric`, `quarri_approve_metric`
- `quarri_get_metric_detail`, `quarri_search_metrics`

**Configuration (8):**
- `quarri_list_agent_prompts`, `quarri_update_agent_prompt`
- `quarri_list_rules`, `quarri_create_rule`, `quarri_update_rule`, `quarri_delete_rule`
- `quarri_vectorize_column_values`, `quarri_list_searchable_columns`

**Canvas (5):**
- `quarri_list_canvases`, `quarri_get_canvas`
- `quarri_create_chart_panel`, `quarri_update_chart_panel`
- `quarri_export_canvas`

**Team (3):**
- `quarri_list_teams`, `quarri_get_team_filters`, `quarri_get_team_restrictions`

**Extraction (7):**
- `quarri_list_extraction_sources`, `quarri_configure_extraction`
- `quarri_discover_tables`, `quarri_propose_transformation`
- `quarri_upload_csv`, `quarri_generate_quarri_schema`, `quarri_list_raw_tables`

**Debug (3):**
- `quarri_read_server_logs`, `quarri_query_repl_activity`, `quarri_read_fly_logs`

**Session (2):**
- `quarri_list_databases`, `quarri_select_database`

## Usage Examples

### Ask a Data Question

```
What were our top 10 products by revenue last month?
```

Claude will use `quarri_query_with_analysis` to:
1. Generate SQL from your question
2. Execute the query
3. Perform statistical analysis
4. Generate a chart
5. Provide key insights

### Create a Metric

```
Help me define a metric for customer lifetime value
```

Claude will guide you through defining the metric using `quarri_metric_builder_agent`.

### Configure Semantic Search

```
Enable semantic search on the product_name column
```

Claude will use `quarri_vectorize_column_values` to enable natural language search.

## Configuration

Credentials are stored in `~/.quarri/credentials` with secure permissions (0600).

### Environment Variables

- `QUARRI_API_URL` - API endpoint (default: https://app.quarri.ai)

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Local Development

```bash
npm run dev
```

## License

MIT

## Support

- GitHub Issues: https://github.com/djayatillake/quarri-claude-plugin/issues
- Documentation: https://docs.quarri.ai
- Email: support@quarri.ai
