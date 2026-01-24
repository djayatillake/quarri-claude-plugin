---
description: Define and validate new business metrics
globs:
alwaysApply: false
---

# /quarri-metric - Metric Definition

Define new business metrics through a guided conversation, validating SQL and documenting for team use.

## When to Use

Use `/quarri-metric` when users want to create metrics:
- "Create a metric for customer lifetime value"
- "Define a retention rate metric"
- "Add a new KPI for average order value"
- "Set up a revenue growth metric"

## Metric Definition Process

### Step 1: Understand the Metric

Gather these details through conversation:

1. **Name**: What should this metric be called?
   - Use clear, business-friendly names
   - Examples: "Monthly Recurring Revenue", "Customer Churn Rate"

2. **Description**: What does it measure and why is it important?
   - Explain in plain English
   - Include business context

3. **Calculation**: How is it computed?
   - What's the formula?
   - What columns are involved?
   - Any special conditions or filters?

4. **Dimensions**: How can it be broken down?
   - By region, product, customer segment?
   - Time granularity (daily, monthly, yearly)?

5. **Synonyms**: What else might users call this?
   - "MRR" for "Monthly Recurring Revenue"
   - "AOV" for "Average Order Value"

### Step 2: Map to Schema

Connect the metric to actual database columns:

1. Fetch schema using `quarri_get_schema`
2. Identify relevant tables and columns
3. Validate column names and types
4. Check for required joins

### Step 3: Write SQL Template

Create the SQL that computes the metric:

```sql
-- Template with placeholders for dimensions
SELECT
    {dimension_columns},
    SUM(order_total) / COUNT(DISTINCT customer_id) as average_order_value
FROM quarri.bridge
WHERE {filter_conditions}
GROUP BY {dimension_columns}
```

### Step 4: Validate

Test the metric:
1. Execute the SQL to verify it works
2. Check the results make sense
3. Verify dimensions produce valid breakdowns

### Step 5: Save

Create the metric using `quarri_create_metric`:
```json
{
    "name": "Average Order Value",
    "description": "Average revenue per order",
    "sql_template": "SELECT SUM(order_total) / COUNT(*) as aov FROM quarri.bridge",
    "dimensions": ["region", "product_category", "month"]
}
```

## Common Metric Patterns

### Simple Aggregation
```sql
-- Total Revenue
SELECT SUM(revenue) as total_revenue
FROM quarri.bridge

-- Order Count
SELECT COUNT(*) as order_count
FROM quarri.bridge
```

### Ratio Metrics
```sql
-- Conversion Rate
SELECT
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::float /
    COUNT(*) as conversion_rate
FROM orders

-- Gross Margin
SELECT
    (SUM(revenue) - SUM(cost)) / SUM(revenue) as gross_margin
FROM quarri.bridge
```

### Time-Based Metrics
```sql
-- Monthly Recurring Revenue
SELECT
    DATE_TRUNC('month', subscription_date) as month,
    SUM(monthly_amount) as mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY month

-- Year-over-Year Growth
SELECT
    current.period,
    (current.revenue - previous.revenue) / previous.revenue as yoy_growth
FROM (
    SELECT DATE_TRUNC('year', order_date) as period, SUM(revenue) as revenue
    FROM orders GROUP BY period
) current
JOIN (
    SELECT DATE_TRUNC('year', order_date) + INTERVAL '1 year' as period, SUM(revenue) as revenue
    FROM orders GROUP BY period
) previous ON current.period = previous.period
```

### Customer Metrics
```sql
-- Customer Lifetime Value
SELECT
    customer_id,
    SUM(order_total) as lifetime_value,
    COUNT(*) as order_count,
    MIN(order_date) as first_order,
    MAX(order_date) as last_order
FROM orders
GROUP BY customer_id

-- Customer Retention Rate
SELECT
    cohort_month,
    COUNT(DISTINCT CASE WHEN months_since_first = 0 THEN customer_id END) as cohort_size,
    COUNT(DISTINCT CASE WHEN months_since_first = 1 THEN customer_id END)::float /
    COUNT(DISTINCT CASE WHEN months_since_first = 0 THEN customer_id END) as month_1_retention
FROM customer_cohorts
GROUP BY cohort_month
```

### Funnel Metrics
```sql
-- Stage Conversion
SELECT
    stage,
    COUNT(*) as count,
    LAG(COUNT(*)) OVER (ORDER BY stage_order) as previous_stage,
    COUNT(*)::float / LAG(COUNT(*)) OVER (ORDER BY stage_order) as conversion
FROM funnel_events
GROUP BY stage, stage_order
ORDER BY stage_order
```

## Dimension Configuration

Metrics can be sliced by dimensions:

### Geographic
- `region`, `country`, `state`, `city`

### Time
- `day`, `week`, `month`, `quarter`, `year`

### Product
- `product_category`, `product_line`, `sku`

### Customer
- `customer_segment`, `customer_tier`, `acquisition_channel`

### Sales
- `sales_rep`, `territory`, `deal_type`

## Metric Validation Checklist

Before saving a metric, verify:

- [ ] SQL executes without errors
- [ ] Results are reasonable (no negative revenue, etc.)
- [ ] Dimensions produce valid breakdowns
- [ ] Edge cases handled (nulls, zeros)
- [ ] Performance is acceptable
- [ ] Name is unique and clear
- [ ] Description is comprehensive

## Output Format

```markdown
## Metric Definition: [Metric Name]

### Summary
**Name**: [Metric Name]
**Description**: [What it measures]
**Synonyms**: [Alternative names]

### Calculation
[Plain English explanation of the formula]

### SQL Template
```sql
[SQL code]
```

### Dimensions
- [Dimension 1]: [Description]
- [Dimension 2]: [Description]

### Validation Results
- Query executed successfully
- Sample result: [Sample value]
- Breakdown by [dimension]: [Sample breakdown]

### Status
[Ready to save / Needs revision]
```

## Conversation Flow

### Opening
"I'll help you define a new metric. Let's start with the basics:
1. What should this metric be called?
2. What does it measure?"

### Clarification Questions
- "What columns or tables does this involve?"
- "Should it be filterable by time period?"
- "What dimensions should users be able to break it down by?"
- "Are there any special conditions or filters?"

### Validation
"I've created the SQL for your metric. Let me test it:
[Shows SQL and results]
Does this look correct?"

### Confirmation
"Here's the complete metric definition:
[Summary]
Should I save this metric?"

## Integration

After creating a metric:
- Use with `/quarri-query` for natural language queries
- Reference in `/quarri-analyze` for comprehensive analysis
- Track on Quarri Canvas dashboards
