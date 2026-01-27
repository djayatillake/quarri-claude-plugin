---
description: Generate SQL queries from natural language questions
globs:
alwaysApply: false
---

# /quarri-query - Natural Language to SQL

Generate SQL queries from natural language questions using your Quarri database schema.

## When to Use

Use `/quarri-query` when users ask data questions like:
- "Show me revenue by region"
- "What are the top 10 customers by order count?"
- "How many orders were placed last month?"

## Workflow

### Step 1: Fetch Query Context (REQUIRED)

**ALWAYS call `quarri_get_query_context` first** before generating any SQL. This single call returns all the context you need:

```
quarri_get_query_context({ question: "<user's question>" })
```

This returns:
- **Schema**: All columns in `quarri.schema` with types and descriptions
- **Rules**: Business logic, naming conventions, and query guidelines
- **Metrics**: Pre-defined calculations (e.g., "Revenue = SUM(sales_amount)")
- **Searchable columns**: Columns with semantic search enabled
- **Value matches**: If the question mentions specific values (names, products, etc.), returns exact database matches

**Example response:**
```json
{
  "schema": {
    "columns": [
      { "name": "order_date", "type": "DATE", "description": "Date of order" },
      { "name": "revenue", "type": "DECIMAL", "description": "Order revenue" },
      { "name": "region", "type": "VARCHAR", "description": "Sales region" }
    ]
  },
  "rules": [
    { "category": "naming", "text": "Use 'revenue' not 'sales' for monetary amounts" },
    { "category": "filters", "text": "Always exclude test orders (is_test = false)" }
  ],
  "metrics": [
    { "name": "Total Revenue", "sql": "SUM(revenue)", "dimensions": ["region", "category"] }
  ],
  "value_matches": [
    { "query": "west coast", "matches": ["West", "Pacific Northwest"], "column": "region" }
  ]
}
```

### Step 2: Understand the Schema

**CRITICAL**: All queries MUST use `quarri.schema` as the ONLY source table. Do NOT query any other tables directly.

The `quarri.schema` view is a pre-joined, denormalized view that contains all the data you need. The schema response shows the columns available in this view.

### Step 3: Generate SQL

When generating SQL, follow these principles:

**Column Selection:**
- Use explicit column names, not `SELECT *`
- Include columns needed for the question
- Add appropriate aggregations (SUM, COUNT, AVG) for measures

**Joins:**
- Prefer the pre-joined `quarri.schema` or `quarri.schema` views
- If joining manually, use the relationships defined in the schema

**Filters:**
- Apply filters mentioned in the question
- Use semantic search results for value matching
- Respect any rules defined for specific columns

**Grouping:**
- Group by all non-aggregated columns
- Consider time granularity (day, month, year) for date columns

**Ordering:**
- Order by the most relevant column (usually the measure, descending)
- Limit results to a reasonable number (default 100)

### Step 4: Validate and Execute

1. Show the generated SQL to the user with a brief explanation
2. Execute using `quarri_execute_sql`
3. Present results in a clear table format

## SQL Generation Patterns

### Aggregation Queries
```sql
SELECT
    dimension_column,
    SUM(measure_column) as total_measure
FROM quarri.schema
WHERE filter_conditions
GROUP BY dimension_column
ORDER BY total_measure DESC
LIMIT 100;
```

### Time Series Queries
```sql
SELECT
    DATE_TRUNC('month', date_column) as period,
    SUM(measure_column) as total_measure
FROM quarri.schema
WHERE date_column >= DATE '2024-01-01'
GROUP BY period
ORDER BY period;
```

### Top N Queries
```sql
SELECT
    dimension_column,
    SUM(measure_column) as total_measure
FROM quarri.schema
GROUP BY dimension_column
ORDER BY total_measure DESC
LIMIT 10;
```

### Comparison Queries
```sql
SELECT
    category_column,
    segment_column,
    SUM(measure_column) as total_measure
FROM quarri.schema
GROUP BY category_column, segment_column
ORDER BY category_column, total_measure DESC;
```

## Handling Ambiguity

When the question is ambiguous:

1. **Multiple possible metrics**: List the available metrics and ask which one to use
2. **Unclear time range**: Default to "all time" or ask for clarification
3. **Unknown column values**: Use `quarri_search_values` to find matches and confirm with user
4. **Multiple valid interpretations**: Present the most likely interpretation and ask for confirmation

## Example Interaction

**User**: "Show revenue by region"

**Claude's process**:

1. **Call quarri_get_query_context**:
```
quarri_get_query_context({ question: "Show revenue by region" })
```

Response includes:
- Schema shows `revenue` (DECIMAL) and `region` (VARCHAR) columns
- Metrics include "Total Revenue" = `SUM(revenue)`
- Rules say to exclude test orders
- No specific value matches needed

2. **Generate SQL using the context**:
```sql
SELECT
    region,
    SUM(revenue) as total_revenue
FROM quarri.schema
WHERE is_test = false
GROUP BY region
ORDER BY total_revenue DESC;
```

3. **Execute and display results**:
```
quarri_execute_sql({ sql: "SELECT region, SUM(revenue)..." })
```

## Error Handling

- If schema fetch fails, report the connection error
- If a column doesn't exist, suggest similar columns from the schema
- If the query fails, explain the error and suggest corrections
- If no results, confirm the query logic and filters are correct

## Output Format

Always present:
1. **Generated SQL**: The query in a code block
2. **Explanation**: Brief description of what the query does
3. **Results**: Data in a formatted table
4. **Row count**: Total rows returned
