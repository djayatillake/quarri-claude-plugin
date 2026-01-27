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

### Step 1: Fetch Context

Before generating SQL, gather the necessary context:

```
1. Get database schema using quarri_get_schema
2. Search for relevant metrics using quarri_search_metrics with the question
3. Get rules that apply using quarri_list_rules
4. If the question mentions specific values (names, categories), use quarri_search_values to find exact matches
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
1. Fetch schema - find `revenue` measure and `region` dimension
2. Search metrics - find "Total Revenue" metric definition
3. Generate SQL:
```sql
SELECT
    region,
    SUM(revenue) as total_revenue
FROM quarri.schema
GROUP BY region
ORDER BY total_revenue DESC;
```
4. Execute and display results in a table

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
