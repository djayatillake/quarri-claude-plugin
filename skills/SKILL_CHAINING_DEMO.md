# Skill Chaining Demonstration

This document demonstrates how the Quarri skills chain together for complex requests, using simulated data to show the expected output flow.

---

## Demo 1: Full Analysis Request

**User Request**: "Analyze revenue trends by product category over the past quarter"

### Skill Chain: `/quarri-analyze` → `/quarri-query` → `/quarri-insights` → `/quarri-chart`

---

### Stage 1: Query Generation (`/quarri-query`)

**Generated SQL:**
```sql
SELECT
    DATE_TRUNC('week', order_date) as week,
    product_category,
    COUNT(*) as order_count,
    COUNT(DISTINCT customer_id) as customers,
    SUM(revenue) as revenue,
    AVG(revenue) as avg_order_value
FROM quarri.bridge
WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY week, product_category
ORDER BY week, product_category
```

**Sample Results:**
| week | product_category | order_count | customers | revenue | avg_order_value |
|------|------------------|-------------|-----------|---------|-----------------|
| 2024-10-07 | Electronics | 156 | 142 | 45,200 | 289.74 |
| 2024-10-07 | Clothing | 234 | 198 | 18,720 | 80.00 |
| 2024-10-07 | Home | 89 | 82 | 12,460 | 140.00 |
| ... | ... | ... | ... | ... | ... |

---

### Stage 2: Statistical Analysis (`/quarri-insights`)

**Statistical Findings:**

#### Descriptive Statistics
| Metric | Electronics | Clothing | Home |
|--------|-------------|----------|------|
| Total Revenue | $542,400 | $224,640 | $149,520 |
| % of Total | 59.2% | 24.5% | 16.3% |
| Avg Weekly Growth | +3.2% | +1.8% | -0.5% |
| Volatility | 12.4% | 8.2% | 15.1% |

#### Key Patterns
- **Trend**: Electronics growing +3.2% weekly, Home declining -0.5%
- **Concentration**: Top category (Electronics) = 59% of revenue
- **Correlation**: Order count and revenue: r = 0.92 (strong positive)
- **Outlier**: Week of 2024-11-25 had 40% spike (Black Friday)

---

### Stage 3: Business Insights (`/quarri-insights` continued)

#### Key Finding
**Electronics drives 59% of total revenue and is growing 3.2% weekly, while Home category is declining 0.5% weekly - consider reallocating marketing investment.**

#### Insights

**1. Concentration Risk**
Electronics represents 59% of revenue from a single category.
- **Implication**: High dependency on one product line
- **Action**: Develop growth strategy for Clothing (24.5%) to diversify

**2. Growth Differential**
Electronics (+3.2%/week) outpacing Clothing (+1.8%) by 78%.
- **Implication**: Gap will widen without intervention
- **Action**: Analyze what's driving Electronics success, apply to other categories

**3. Home Decline**
Home category declining -0.5% weekly over 12 weeks.
- **Implication**: Potential market share loss or seasonal effect
- **Action**: Investigate: pricing, competition, product assortment

---

### Stage 4: Visualization (`/quarri-chart`)

**Recommended Chart**: Multi-line chart showing weekly revenue by category

**QuickChart URL**:
```
https://quickchart.io/chart?c={type:'line',data:{labels:['Oct 7','Oct 14','Oct 21','Oct 28','Nov 4','Nov 11','Nov 18','Nov 25','Dec 2','Dec 9','Dec 16','Dec 23'],datasets:[{label:'Electronics',data:[45200,46800,48100,49500,51200,52800,54100,75700,56200,57800,59100,60500],borderColor:'%234F46E5',fill:false},{label:'Clothing',data:[18720,19100,19400,19800,20100,20500,20800,29100,21400,21800,22100,22500],borderColor:'%2310B981',fill:false},{label:'Home',data:[12460,12400,12350,12300,12250,12200,12150,17000,12050,12000,11950,11900],borderColor:'%23F59E0B',fill:false}]},options:{title:{display:true,text:'Weekly Revenue by Category (Q4 2024)'}}}
```

**ASCII Alternative**:
```
Weekly Revenue by Category (Q4 2024)

Electronics  ▁▂▂▃▃▄▄█▅▅▆▆  $45K → $60K (+34%)
Clothing     ▁▁▂▂▂▃▃█▃▃▃▄  $19K → $23K (+20%)
Home         ▂▂▂▂▂▂▂▄▁▁▁▁  $12K → $12K (-5%)
             Oct        Nov        Dec
```

---

## Demo 2: Root Cause Analysis Request

**User Request**: "Why did revenue drop last month?"

### Skill Chain: `/quarri-diagnose` (with metric tree decomposition)

---

### Stage 1: Identify the Metric
- **Target**: Revenue
- **Direction**: Decrease
- **Period**: Last month vs previous month

### Stage 2: Build Metric Tree

```
Revenue = Customers × Orders/Customer × Revenue/Order

├── Customers (unique buyers)
│   ├── New Customers
│   └── Returning Customers
│
├── Orders per Customer (frequency)
│
└── Revenue per Order (basket size)
    ├── Units per order
    └── Price per unit
```

### Stage 3: Query Components

**Period Comparison:**
| Component | Previous Month | Current Month | Change % |
|-----------|----------------|---------------|----------|
| Revenue | $100,000 | $90,000 | **-10%** |
| Customers | 1,000 | 920 | **-8%** |
| Orders/Customer | 2.50 | 2.45 | -2% |
| Revenue/Order | $40.00 | $39.90 | -0.25% |

### Stage 4: Impact Attribution

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

PRIMARY DRIVER: Customer count (-8%, 80% of total decline)
```

### Stage 5: Drill Down

```
Customer Count dropped 8% (1,000 → 920)

Sub-component Analysis:
┌─────────────────────┬──────────┬─────────┬──────────┐
│ Component           │ Previous │ Current │ Change % │
├─────────────────────┼──────────┼─────────┼──────────┤
│ New Customers       │ 300      │ 200     │ -33%  ◀──│
│ Returning Customers │ 700      │ 720     │ +3%      │
└─────────────────────┴──────────┴─────────┴──────────┘

PRIMARY DRIVER: New customer acquisition (-33%)
```

```
New Customer Acquisition dropped 33% (300 → 200)

By Channel:
┌─────────────────────┬──────────┬─────────┬──────────┐
│ Channel             │ Previous │ Current │ Change % │
├─────────────────────┼──────────┼─────────┼──────────┤
│ Paid Search         │ 150      │ 80      │ -47%  ◀──│
│ Paid Social         │ 80       │ 60      │ -25%     │
│ Organic             │ 70       │ 60      │ -14%     │
└─────────────────────┴──────────┴─────────┴──────────┘

ROOT CAUSE: Paid search acquisition dropped 47%
```

### Stage 6: Output

```markdown
## Diagnosis: Revenue Dropped 10% ($100K → $90K)

### Root Cause Chain
```
Revenue ↓10%
└── Customer Count ↓8% (80% of impact)
    └── New Customers ↓33%
        └── Paid Search ↓47% ← ROOT CAUSE
```

### Confidence Level
**High** - Clear single driver with consistent attribution at each level

### Evidence
- Paid search was largest acquisition channel (50% of new customers)
- Drop coincides with Q4 when CPCs typically increase 20-40%
- Retention improved (+3%), ruling out product/service issues

### Hypothesis
Paid search performance degraded due to increased Q4 competition
driving up CPCs. The 47% drop in paid search volume directly
explains 80% of the revenue decline.

### Recommended Actions

**Immediate (This Week)**
1. Review Google Ads auction insights for competitive pressure
2. Check for any campaign changes around the decline date
3. Analyze CPC trends - did cost per click increase?

**Short-term (This Month)**
1. Increase budget if ROAS is still profitable despite higher CPCs
2. Test new ad copy to improve Quality Score
3. Expand to lower-competition keywords

**Investigation Needed**
1. What was the CPC change? (external vs internal)
2. Did conversion rate from paid search change?
3. Are competitors running aggressive promotions?
```

---

## Demo 3: Metric Definition with Tree

**User Request**: "Create a metric for customer lifetime value with its component drivers"

### Skill: `/quarri-metric`

---

### Output:

```markdown
## Metric Definition: Customer Lifetime Value (CLV)

### Summary
**Name**: Customer Lifetime Value
**Description**: Total revenue expected from a customer over their entire relationship
**Synonyms**: CLV, LTV, Lifetime Value, Customer Value

### Calculation
CLV = Average Revenue Per User (ARPU) × Average Customer Lifetime × Gross Margin

### SQL Template
```sql
WITH customer_metrics AS (
    SELECT
        customer_id,
        SUM(revenue) as total_revenue,
        COUNT(*) as order_count,
        MIN(order_date) as first_order,
        MAX(order_date) as last_order,
        DATEDIFF('day', MIN(order_date), MAX(order_date)) as tenure_days
    FROM quarri.bridge
    GROUP BY customer_id
)
SELECT
    AVG(total_revenue) as avg_revenue_per_customer,
    AVG(tenure_days) / 365.0 as avg_lifetime_years,
    AVG(total_revenue) * (AVG(tenure_days) / 365.0) as estimated_clv
FROM customer_metrics
WHERE order_count >= 2  -- Exclude one-time buyers
```

### Metric Tree
```
CLV = ARPU × Avg Lifetime × Gross Margin

├── ARPU (Average Revenue Per User)
│   ├── Order Frequency
│   │   ├── Time between purchases
│   │   └── Reactivation rate
│   └── Average Order Value
│       ├── Units per order
│       └── Price per unit
│
├── Average Customer Lifetime
│   ├── Retention Rate (monthly)
│   ├── Churn Rate = 1 - Retention
│   └── Avg Lifetime = 1 / Churn Rate
│
└── Gross Margin
    ├── Revenue
    └── Cost of Goods Sold
```

### Dimensions
- **Segment**: Enterprise vs SMB vs Consumer
- **Acquisition Channel**: Paid vs Organic vs Referral
- **Product Category**: Electronics vs Clothing vs Home
- **Cohort**: By signup month

### Validation Results
- Query executed successfully
- Sample CLV: $847 (all customers)
- By segment: Enterprise $2,340 | SMB $612 | Consumer $234

### Status
Ready to save
```

---

## Summary: Skill Chaining Patterns

| Request Type | Skill Chain | Output |
|--------------|-------------|--------|
| Simple query | query | SQL + results |
| Full analysis | analyze → query → insights → chart | Pipeline with viz |
| Root cause | diagnose (with metric tree) | Attribution + actions |
| Metric definition | metric | Definition + tree |
| Visualization | chart | QuickChart URL + alternatives |

The skills-first architecture ensures:
1. **Correct routing** based on request intent
2. **Proper chaining** for complex requests
3. **Consistent output** formats across skills
4. **Professional frameworks** (MECE, Metric Trees) applied automatically
