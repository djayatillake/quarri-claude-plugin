---
description: Define business metrics and build metric trees for KPI decomposition
globs:
alwaysApply: false
---

# /quarri-metric - Metric Definition & Metric Trees

Define new business metrics and build metric trees that decompose KPIs into component drivers for root cause analysis.

## When to Use

Use `/quarri-metric` when users want to:
- Create metrics: "Create a metric for customer lifetime value"
- Define KPIs: "Define a retention rate metric"
- Build metric trees: "Decompose revenue into its drivers"
- Understand relationships: "What metrics drive conversion rate?"

## Part 1: Metric Definition

### Step 1: Understand the Metric

Gather these details through conversation:

1. **Name**: What should this metric be called?
   - Use clear, business-friendly names
   - Examples: "Monthly Recurring Revenue", "Customer Churn Rate"

2. **Description**: What does it measure and why is it important?

3. **Calculation**: How is it computed?
   - What's the formula?
   - What columns are involved?

4. **Dimensions**: How can it be broken down?
   - By region, product, customer segment?
   - Time granularity (daily, monthly, yearly)?

5. **Synonyms**: What else might users call this?
   - "MRR" for "Monthly Recurring Revenue"
   - "AOV" for "Average Order Value"

### Step 2: Map to Schema

1. Fetch schema using `quarri_get_schema`
2. Identify relevant tables and columns
3. Validate column names and types

### Step 3: Write SQL Template

```sql
-- Template with placeholders for dimensions
SELECT
    {dimension_columns},
    SUM(order_total) / COUNT(DISTINCT customer_id) as average_order_value
FROM quarri.bridge
WHERE {filter_conditions}
GROUP BY {dimension_columns}
```

### Step 4: Save

Create the metric using `quarri_create_metric`:
```json
{
    "name": "Average Order Value",
    "description": "Average revenue per order",
    "sql_template": "SELECT SUM(order_total) / COUNT(*) as aov FROM quarri.bridge",
    "dimensions": ["region", "product_category", "month"]
}
```

## Part 2: Metric Trees

Metric trees decompose a top-level KPI into its component drivers, enabling systematic root cause analysis.

### What is a Metric Tree?

A metric tree shows how a high-level metric breaks down into component parts:

```
Revenue
├── = Customers × Orders/Customer × Revenue/Order
│
├── Customers
│   ├── New Customers (acquisition)
│   └── Returning Customers (retention)
│
├── Orders per Customer (frequency)
│   ├── Purchase occasions
│   └── Repeat purchase rate
│
└── Revenue per Order (basket size)
    ├── Units per order
    ├── Price per unit
    └── Discount rate
```

### Common Metric Tree Patterns

#### E-Commerce Revenue Tree
```
Revenue = Traffic × Conversion Rate × Average Order Value

├── Traffic
│   ├── Organic (SEO, direct)
│   ├── Paid (ads, affiliates)
│   └── Referral (social, email)
│
├── Conversion Rate
│   ├── Add-to-cart rate
│   ├── Cart-to-checkout rate
│   └── Checkout completion rate
│
└── Average Order Value
    ├── Items per order
    └── Price per item
```

#### SaaS Revenue Tree
```
MRR = Customers × ARPU

├── Customers
│   ├── New MRR (new customers)
│   ├── Expansion MRR (upgrades)
│   ├── Contraction MRR (downgrades)
│   └── Churned MRR (cancellations)
│
└── ARPU (Average Revenue Per User)
    ├── Plan mix
    ├── Add-on adoption
    └── Usage-based fees
```

#### Customer Lifetime Value Tree
```
CLV = ARPU × Avg Lifetime × Gross Margin

├── ARPU (Average Revenue Per User)
│   ├── Base subscription
│   └── Additional services
│
├── Average Customer Lifetime
│   ├── 1 / Churn Rate
│   └── Retention by cohort
│
└── Gross Margin
    ├── Revenue
    └── Cost of goods/service
```

#### Sales Pipeline Tree
```
Revenue = Leads × Conversion Rate × Deal Size

├── Leads
│   ├── Marketing Qualified (MQL)
│   ├── Sales Qualified (SQL)
│   └── Opportunity Created
│
├── Conversion Rate
│   ├── MQL → SQL rate
│   ├── SQL → Opportunity rate
│   ├── Opportunity → Proposal rate
│   └── Proposal → Close rate
│
└── Deal Size
    ├── Contract value
    ├── Upsell/cross-sell
    └── Discounting
```

### Building a Metric Tree

#### Step 1: Identify the Top-Level Metric
- What KPI are you trying to understand or improve?
- Example: "Revenue", "Conversion Rate", "Retention"

#### Step 2: Find the Mathematical Relationship
Express the metric as a formula:
- **Multiplicative**: Revenue = Customers × ARPU
- **Additive**: Revenue = Product A + Product B + Product C
- **Ratio**: Conversion = Conversions / Visitors

#### Step 3: Decompose Each Component
For each component, ask: "What drives this?"
- Keep decomposing until you reach actionable metrics
- Stop when you reach metrics you can directly measure and influence

#### Step 4: Validate the Tree
- Components should be MECE (mutually exclusive, collectively exhaustive)
- Math should work: components should sum/multiply to parent
- Each leaf should be measurable in your data

### Using Metric Trees for Analysis

Once you have a metric tree, use it for:

**1. Performance Attribution**
When a metric changes, quantify how much each driver contributed:
```
Revenue dropped 10% ($100K → $90K)

Attribution:
├── Customer count: -5% impact ($5K)
├── Order frequency: -3% impact ($3K)
└── Average order value: -2% impact ($2K)
```

**2. Root Cause Analysis**
Drill into the largest impact driver:
```
Customer count dropped 5%
├── New customers: -8% (PRIMARY CAUSE)
│   └── Paid acquisition: -15%
│   └── Organic: +2%
└── Retention: +3%
```

**3. Opportunity Sizing**
Identify highest-leverage improvements:
```
If we improve conversion rate by 10%:
├── Current: 2.5% conversion
├── Target: 2.75% conversion
└── Revenue impact: +$50K/month
```

### SQL for Metric Tree Analysis

Generate SQL that calculates all components of a metric tree:

```sql
-- Revenue metric tree components
WITH metrics AS (
    SELECT
        period,
        COUNT(DISTINCT customer_id) as customers,
        COUNT(*) as orders,
        SUM(revenue) as revenue,
        -- Derived metrics
        COUNT(*)::float / COUNT(DISTINCT customer_id) as orders_per_customer,
        SUM(revenue)::float / COUNT(*) as revenue_per_order
    FROM quarri.bridge
    WHERE order_date >= DATE '2024-01-01'
    GROUP BY period
)
SELECT
    period,
    customers,
    orders_per_customer,
    revenue_per_order,
    revenue,
    -- Verify: customers * orders_per_customer * revenue_per_order ≈ revenue
    customers * orders_per_customer * revenue_per_order as calculated_revenue
FROM metrics
ORDER BY period;
```

### Period-over-Period Comparison

```sql
-- Compare current vs previous period for root cause analysis
WITH current_period AS (
    SELECT
        COUNT(DISTINCT customer_id) as customers,
        COUNT(*)::float / COUNT(DISTINCT customer_id) as frequency,
        SUM(revenue)::float / COUNT(*) as aov,
        SUM(revenue) as revenue
    FROM quarri.bridge
    WHERE order_date >= DATE '2024-12-01'
),
previous_period AS (
    SELECT
        COUNT(DISTINCT customer_id) as customers,
        COUNT(*)::float / COUNT(DISTINCT customer_id) as frequency,
        SUM(revenue)::float / COUNT(*) as aov,
        SUM(revenue) as revenue
    FROM quarri.bridge
    WHERE order_date >= DATE '2024-11-01' AND order_date < DATE '2024-12-01'
)
SELECT
    'Customers' as metric,
    p.customers as previous,
    c.customers as current,
    (c.customers - p.customers)::float / p.customers * 100 as pct_change
FROM current_period c, previous_period p
UNION ALL
SELECT
    'Frequency' as metric,
    p.frequency as previous,
    c.frequency as current,
    (c.frequency - p.frequency)::float / p.frequency * 100 as pct_change
FROM current_period c, previous_period p
-- ... continue for all components
```

## Common Metric Patterns

### Simple Aggregation
```sql
-- Total Revenue
SELECT SUM(revenue) as total_revenue FROM quarri.bridge

-- Order Count
SELECT COUNT(*) as order_count FROM quarri.bridge
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
FROM (...) current
JOIN (...) previous ON current.period = previous.period + INTERVAL '1 year'
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
```

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

### Metric Tree (if applicable)
```
[Top-level metric]
├── [Component 1]
│   ├── [Sub-component 1a]
│   └── [Sub-component 1b]
├── [Component 2]
└── [Component 3]
```

### Validation Results
- Query executed successfully
- Sample result: [Sample value]

### Status
[Ready to save / Needs revision]
```

## Integration

After creating a metric:
- Use with `/quarri-query` for natural language queries
- Reference in `/quarri-analyze` for comprehensive analysis
- Use `/quarri-diagnose` for root cause analysis with metric trees
