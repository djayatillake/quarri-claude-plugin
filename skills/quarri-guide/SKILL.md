---
description: Guidance for using Quarri tools transparently
globs:
alwaysApply: true
---

# Quarri Tool Usage Guidelines

When using Quarri tools, follow these transparency principles to ensure users understand what actions are being taken on their data systems.

## Configuration Changes Require Confirmation

Before making any configuration changes, ALWAYS show the user what will be changed and get explicit confirmation:

### 1. Schema Relationships (`quarri_generate_quarri_schema`)
- Show the proposed bridge table structure
- Explain which tables will be joined and how
- Ask: "Should I apply this schema configuration?"

### 2. Vectorization (`quarri_vectorize_column_values`)
- Explain which column will be vectorized
- Note that this enables semantic search on that column
- Mention any processing time implications
- Ask: "Should I enable semantic search for this column?"

### 3. Rules (`quarri_create_rule`, `quarri_update_rule`, `quarri_delete_rule`)
- Show the exact rule text being added/modified/deleted
- Explain how it will affect query generation
- Ask: "Should I save this rule?"

### 4. Agent Prompts (`quarri_update_agent_prompt`)
- Show the current vs proposed prompt (or summarize changes)
- Explain the behavioral change
- Ask: "Should I update this agent's behavior?"

### 5. Transformations (`quarri_staging_agent`, `quarri_modeling_agent`, `quarri_transformers_agent`)
- Show the proposed SQL/transformation
- Explain what data will be affected
- Note if this creates new views/tables
- Ask: "Should I apply this transformation?"

### 6. Extractions (`quarri_configure_extraction`)
- List the resources being configured
- Note any credentials being stored (show redacted versions)
- Explain the data flow
- Ask: "Should I configure this data source?"

### 7. Metrics (`quarri_create_metric`, `quarri_approve_metric`)
- Show the metric definition (name, SQL template, dimensions)
- Explain what the metric measures
- Ask: "Should I create/approve this metric?"

### 8. Canvas Changes (`quarri_create_chart_panel`, `quarri_update_chart_panel`)
- Describe the chart being created/modified
- Show the SQL query that powers it
- Ask: "Should I add/update this chart?"

## Read-Only Tools (No Confirmation Needed)

These tools only read data and don't require explicit confirmation:
- `quarri_query_agent` - Generates SQL (execution still shows query)
- `quarri_execute_sql` - Show the query being executed
- `quarri_get_schema` - Schema introspection
- `quarri_search_values` - Semantic search
- `quarri_explain_agent` - Query explanation
- `quarri_chart_agent` - Chart generation from data
- `quarri_insight_agent` - Generate insights
- `quarri_stats_agent` - Statistical analysis
- `quarri_planning_agent` - Analysis planning
- `quarri_query_with_analysis` - Full analysis pipeline
- All `list_*` and `get_*` tools

## Best Practices

### Always Show SQL Before Execution
When using `quarri_query_agent` followed by `quarri_execute_sql`:
1. Show the generated SQL to the user
2. Briefly explain what it will query
3. Then execute and show results

### Use `quarri_query_with_analysis` for Comprehensive Questions
For questions that benefit from full analysis:
- The pipeline handles query generation, execution, stats, and insights
- Results include charts when appropriate
- More efficient than calling individual tools

### Database Selection
- Use `quarri_list_databases` to show available databases
- Use `quarri_select_database` to switch context
- Always confirm which database is active for important operations

### Error Handling
- If a tool fails, explain the error clearly
- Suggest potential fixes or alternative approaches
- Don't retry failed operations without user acknowledgment

## Security Considerations

- Never expose raw credentials in outputs
- Don't log or display API tokens
- Mask sensitive column values when appropriate
- Respect team-level data restrictions
