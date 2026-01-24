---
description: Explain SQL queries in plain English
globs:
alwaysApply: false
---

# /quarri-explain - SQL Explanation

Explain SQL queries in plain, understandable English, including what data they retrieve and how they work.

## When to Use

Use `/quarri-explain` when users need to understand queries:
- "What does this query do?"
- "Explain this SQL"
- "Help me understand this query"
- "Break down this SQL statement"

## Explanation Structure

### 1. One-Line Summary

Start with a concise summary of what the query does:
> "This query shows total revenue by product category for the last 12 months."

### 2. Data Source Explanation

Explain where the data comes from:
- Which tables are being queried
- How tables are joined (if applicable)
- What each table represents

### 3. Column Breakdown

For each column in SELECT:
- What it represents
- Any transformations or calculations
- Aliases and their meaning

### 4. Filter Explanation

For each WHERE condition:
- What records are being filtered
- The logic of each condition
- Combined effect of multiple conditions

### 5. Grouping and Aggregation

If GROUP BY is present:
- What defines each group
- How measures are aggregated
- Effect on result granularity

### 6. Ordering and Limits

Explain the result ordering:
- Sort columns and direction
- Why this ordering makes sense
- Limit effects

## Query Pattern Recognition

### Aggregation Query
```sql
SELECT region, SUM(revenue) as total_revenue
FROM sales
GROUP BY region
ORDER BY total_revenue DESC;
```

**Explanation**: "This query calculates total revenue for each region, sorted from highest to lowest revenue."

### Join Query
```sql
SELECT c.name, COUNT(o.id) as order_count
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name;
```

**Explanation**: "This query counts how many orders each customer has placed. It uses a LEFT JOIN to include customers even if they have no orders."

### Time-Based Query
```sql
SELECT DATE_TRUNC('month', order_date) as month,
       SUM(revenue) as monthly_revenue
FROM orders
WHERE order_date >= DATE '2024-01-01'
GROUP BY month
ORDER BY month;
```

**Explanation**: "This query shows monthly revenue totals starting from January 2024, organized chronologically."

### Subquery
```sql
SELECT *
FROM orders
WHERE customer_id IN (
    SELECT id FROM customers WHERE region = 'North'
);
```

**Explanation**: "This query finds all orders from customers in the North region. The inner query first identifies those customers, then the outer query retrieves their orders."

### Window Function
```sql
SELECT product, revenue,
       RANK() OVER (ORDER BY revenue DESC) as rank
FROM products;
```

**Explanation**: "This query ranks products by revenue, with the highest revenue getting rank 1. Products with equal revenue get the same rank."

## Explanation Template

```markdown
## Query Explanation

### Summary
[One-line plain English description]

### Data Sources
- **[Table name]**: [What it contains]
- **Join**: [How tables connect]

### What It Retrieves
| Column | Meaning |
|--------|---------|
| [column1] | [explanation] |
| [column2] | [explanation] |

### Filters Applied
- [Condition 1]: [Plain English meaning]
- [Condition 2]: [Plain English meaning]

### Grouping
[Explanation of aggregation level]

### Ordering
[How results are sorted and why]

### Expected Results
[Description of what the output will look like]
```

## Common SQL Elements to Explain

### Functions
- `SUM()`: "Adds up all values"
- `COUNT()`: "Counts how many records"
- `AVG()`: "Calculates the average"
- `MAX()/MIN()`: "Finds the highest/lowest value"
- `DATE_TRUNC()`: "Groups dates by [period]"
- `COALESCE()`: "Uses the first non-null value"

### Joins
- `INNER JOIN`: "Only includes records that match in both tables"
- `LEFT JOIN`: "Includes all records from the first table, matching records from the second"
- `RIGHT JOIN`: "Includes all records from the second table, matching records from the first"
- `FULL JOIN`: "Includes all records from both tables"

### Operators
- `IN`: "Matches any value in the list"
- `BETWEEN`: "Within the specified range"
- `LIKE`: "Matches the pattern"
- `IS NULL`: "Has no value"

## Error Explanation

When queries have errors, explain:
1. What the error message means
2. Where the problem likely is
3. How to fix it

Example:
> "The error 'column not found' means the query references a column that doesn't exist in the specified table. Check if 'revenue' should be 'total_revenue' based on your schema."

## Context Integration

Enhance explanations with Quarri context:
- Reference the actual schema for table descriptions
- Explain business meaning of columns
- Connect to defined metrics when applicable
