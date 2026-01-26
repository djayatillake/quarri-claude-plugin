---
description: Root cause analysis using metric trees to diagnose KPI changes
globs:
alwaysApply: false
---

# /quarri-diagnose - Root Cause Analysis

Perform systematic root cause analysis using metric trees to diagnose why KPIs changed.

## When to Use

Use `/quarri-diagnose` when users ask diagnostic questions:
- "Why did revenue drop last month?"
- "What's causing churn to increase?"
- "Why is conversion rate declining?"
- "What's driving the growth in customer acquisition?"

This skill is different from `/quarri-analyze`:
- `/quarri-analyze`: General analysis with statistics and insights
- `/quarri-diagnose`: Focused root cause investigation using metric decomposition

## Diagnostic Workflow

```
1. Identify the metric of concern
       ↓
2. Build/retrieve metric tree (decompose KPI)
       ↓
3. Query each component for current vs previous period
       ↓
4. Calculate period-over-period changes
       ↓
5. Identify component with largest negative impact
       ↓
6. Drill down recursively if needed
       ↓
7. Generate root cause hypothesis with evidence
       ↓
8. Recommend actions to address root cause
```

## Step 1: Identify the Metric

Parse the user's question to determine:
- **Target metric**: What KPI are they concerned about?
- **Direction**: Is it a drop, increase, or unexpected behavior?
- **Time period**: When did this happen? What's the comparison period?

**Examples:**
- "Why did revenue drop?" → Metric: Revenue, Direction: Decrease
- "What's causing churn to increase?" → Metric: Churn Rate, Direction: Increase
- "Conversion tanked last week" → Metric: Conversion Rate, Direction: Decrease, Period: Last week

## Step 2: Build the Metric Tree

Either retrieve an existing metric tree or build one dynamically:

### Revenue Tree
```
Revenue = Customers × Orders/Customer × Revenue/Order

├── Customers
│   ├── New Customers
│   └── Returning Customers
│
├── Orders per Customer
│   └── Purchase frequency
│
└── Revenue per Order
    ├── Units per order
    └── Price per unit
```

### Conversion Rate Tree
```
Conversion = Conversions / Visitors

├── Visitors
│   ├── Organic traffic
│   ├── Paid traffic
│   └── Direct traffic
│
└── Conversions (by funnel stage)
    ├── View → Add to Cart
    ├── Cart → Checkout
    └── Checkout → Purchase
```

### Churn Tree
```
Churn Rate = Churned Customers / Total Customers

├── Churned Customers
│   ├── By tenure (new vs established)
│   ├── By segment (enterprise vs SMB)
│   └── By product usage
│
└── Total Customers
    └── (Denominator context)
```

## Step 3: Query Components

Generate SQL to calculate each component for current and previous periods:

```sql
-- Root cause analysis: Revenue components
WITH current_period AS (
    SELECT
        COUNT(DISTINCT customer_id) as customers,
        COUNT(DISTINCT CASE WHEN is_new_customer THEN customer_id END) as new_customers,
        COUNT(DISTINCT CASE WHEN NOT is_new_customer THEN customer_id END) as returning_customers,
        COUNT(*) as orders,
        COUNT(*)::float / NULLIF(COUNT(DISTINCT customer_id), 0) as orders_per_customer,
        SUM(revenue) as revenue,
        SUM(revenue)::float / NULLIF(COUNT(*), 0) as revenue_per_order,
        SUM(units)::float / NULLIF(COUNT(*), 0) as units_per_order,
        SUM(revenue)::float / NULLIF(SUM(units), 0) as price_per_unit
    FROM quarri.bridge
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
),
previous_period AS (
    SELECT
        COUNT(DISTINCT customer_id) as customers,
        COUNT(DISTINCT CASE WHEN is_new_customer THEN customer_id END) as new_customers,
        COUNT(DISTINCT CASE WHEN NOT is_new_customer THEN customer_id END) as returning_customers,
        COUNT(*) as orders,
        COUNT(*)::float / NULLIF(COUNT(DISTINCT customer_id), 0) as orders_per_customer,
        SUM(revenue) as revenue,
        SUM(revenue)::float / NULLIF(COUNT(*), 0) as revenue_per_order,
        SUM(units)::float / NULLIF(COUNT(*), 0) as units_per_order,
        SUM(revenue)::float / NULLIF(SUM(units), 0) as price_per_unit
    FROM quarri.bridge
    WHERE order_date >= CURRENT_DATE - INTERVAL '60 days'
      AND order_date < CURRENT_DATE - INTERVAL '30 days'
)
SELECT
    metric,
    previous_value,
    current_value,
    change_pct,
    impact_pct
FROM (
    SELECT 'customers' as metric, p.customers as previous_value, c.customers as current_value,
           (c.customers - p.customers)::float / NULLIF(p.customers, 0) * 100 as change_pct,
           ((c.customers - p.customers) * p.orders_per_customer * p.revenue_per_order)::float / NULLIF(p.revenue, 0) * 100 as impact_pct
    FROM current_period c, previous_period p
    UNION ALL
    -- Continue for all components...
) metrics
ORDER BY ABS(impact_pct) DESC;
```

## Step 4: Calculate Impact Attribution

For each component, calculate its contribution to the overall change:

### Multiplicative Decomposition
For `Revenue = A × B × C`:

```
Total Change = Revenue_current - Revenue_previous

Impact of A = (A_curr - A_prev) × B_prev × C_prev
Impact of B = A_curr × (B_curr - B_prev) × C_prev
Impact of C = A_curr × B_curr × (C_curr - C_prev)

(Sum of impacts ≈ Total Change)
```

### Additive Decomposition
For `Revenue = A + B + C`:

```
Total Change = Revenue_current - Revenue_previous

Impact of A = A_curr - A_prev
Impact of B = B_curr - B_prev
Impact of C = C_curr - C_prev

(Sum of impacts = Total Change exactly)
```

## Step 5: Identify Primary Driver

Rank components by their impact on the overall metric:

```
Revenue dropped 10% ($100K → $90K = -$10K)

Impact Attribution:
┌─────────────────────┬──────────┬─────────┬──────────┬──────────────┐
│ Component           │ Previous │ Current │ Change % │ Impact $     │
├─────────────────────┼──────────┼─────────┼──────────┼──────────────┤
│ Customers           │ 1,000    │ 920     │ -8%      │ -$8,000  ◀── │
│ Orders/Customer     │ 2.5      │ 2.45    │ -2%      │ -$1,800      │
│ Revenue/Order       │ $40      │ $39.90  │ -0.25%   │ -$200        │
└─────────────────────┴──────────┴─────────┴──────────┴──────────────┘

PRIMARY DRIVER: Customer count (-8%, -$8K of -$10K total)
```

## Step 6: Drill Down

If the primary driver has sub-components, recurse:

```
Customer Count dropped 8%

Sub-component Analysis:
┌─────────────────────┬──────────┬─────────┬──────────┐
│ Component           │ Previous │ Current │ Change % │
├─────────────────────┼──────────┼─────────┼──────────┤
│ New Customers       │ 300      │ 200     │ -33%  ◀──│
│ Returning Customers │ 700      │ 720     │ +3%      │
└─────────────────────┴──────────┴─────────┴──────────┘

PRIMARY DRIVER: New customer acquisition (-33%)
```

Continue drilling until reaching actionable root cause:

```
New Customer Acquisition dropped 33%

Sub-component Analysis (by channel):
┌─────────────────────┬──────────┬─────────┬──────────┐
│ Channel             │ Previous │ Current │ Change % │
├─────────────────────┼──────────┼─────────┼──────────┤
│ Paid Search         │ 150      │ 80      │ -47%  ◀──│
│ Paid Social         │ 80       │ 60      │ -25%     │
│ Organic             │ 70       │ 60      │ -14%     │
└─────────────────────┴──────────┴─────────┴──────────┘

ROOT CAUSE IDENTIFIED: Paid search acquisition dropped 47%
```

## Step 7: Generate Hypothesis

Based on the analysis, generate actionable root cause hypothesis:

```markdown
## Root Cause Analysis: Revenue Decline

### Summary
Revenue dropped 10% ($100K → $90K) in the last 30 days.

### Root Cause Chain
```
Revenue ↓10%
└── Customer Count ↓8% (80% of impact)
    └── New Customers ↓33%
        └── Paid Search ↓47% ← ROOT CAUSE
```

### Evidence
- Paid search was the largest acquisition channel (50% of new customers)
- Paid search cost per acquisition increased 35%
- Conversion rate from paid search stable (not a landing page issue)

### Confidence Level
**High** - Clear attribution path with consistent data

### Hypothesis
Paid search performance degraded due to increased competition or
changed bid strategy. The drop in paid search volume directly
explains the majority of revenue decline.
```

## Step 8: Recommend Actions

Provide actionable recommendations:

```markdown
### Recommended Actions

**Immediate (This Week)**
1. Review paid search campaign performance in Google Ads
2. Check for recent bid strategy or budget changes
3. Analyze competitor activity in auction insights

**Short-term (This Month)**
1. Optimize underperforming ad groups
2. Test new ad copy and landing pages
3. Consider increasing budget if ROAS is still profitable

**Investigation Needed**
1. Did CPC increase? (external market pressure)
2. Did quality score drop? (internal issue)
3. Were there any campaign changes around the decline date?
```

## Output Format

```markdown
## Diagnosis: [Metric] [Direction] [Magnitude]

### Metric Tree
```
[Top-level metric]
├── [Component 1] [change] ← [marker if primary]
├── [Component 2] [change]
└── [Component 3] [change]
```

### Impact Attribution
| Component | Previous | Current | Change % | Impact |
|-----------|----------|---------|----------|--------|
| ...       | ...      | ...     | ...      | ...    |

### Root Cause Chain
```
[Top metric] [change]
└── [Driver 1] [change] (X% of impact)
    └── [Driver 2] [change]
        └── [ROOT CAUSE] [change]
```

### Confidence Level
[High/Medium/Low] - [Reasoning]

### Evidence
- [Supporting data point 1]
- [Supporting data point 2]
- [Supporting data point 3]

### Hypothesis
[Clear statement of what caused the change]

### Recommended Actions

**Immediate**
1. [Action 1]
2. [Action 2]

**Short-term**
1. [Action 1]
2. [Action 2]

**Investigation Needed**
1. [Question to answer]
2. [Data to gather]
```

## Confidence Levels

### High Confidence
- Clear attribution path (single dominant driver)
- Consistent data across dimensions
- Change magnitude is significant (>20%)
- Root cause is specific and actionable

### Medium Confidence
- Multiple contributing drivers
- Some data inconsistencies
- Need additional context for certainty
- Root cause is somewhat general

### Low Confidence
- No clear dominant driver
- Data quality issues
- Multiple possible explanations
- Need more investigation

## Integration

This skill works well with:
- `/quarri-metric`: Use existing metric definitions and trees
- `/quarri-query`: Get additional data to validate hypotheses
- `/quarri-analyze`: Follow-up with detailed segment analysis
- `/quarri-chart`: Visualize the change over time
