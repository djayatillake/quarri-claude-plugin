---
description: Generate actionable business insights from data analysis
globs:
alwaysApply: false
---

# /quarri-insights - Business Insight Generation

Generate actionable business insights from data and statistical analysis results.

## When to Use

Use `/quarri-insights` when users need business intelligence:
- "What insights can you give me from this data?"
- "What should I learn from these numbers?"
- "What actions should we take based on this?"
- "Summarize the key findings"

## Insight Generation Framework

### 1. Pattern Recognition

Identify these patterns in the data:

**Trends**
- Is the metric growing, declining, or stable?
- What's the rate of change?
- Are there inflection points?

**Concentrations**
- Does a small portion drive most results? (Pareto principle)
- Are there dominant segments?

**Anomalies**
- Are there outliers?
- Are there unexpected values?
- Are there gaps or missing patterns?

**Relationships**
- Do variables correlate?
- Are there surprising connections?
- What drives what?

### 2. Insight Categories

Generate insights across these categories:

#### Key Finding
The single most important takeaway:
> "Electronics drives 68% of total revenue but represents only 25% of product categories."

#### Performance Insights
How things are performing:
> "Revenue grew 23% YoY, outpacing the industry average of 15%."
> "Customer retention improved from 72% to 81% after implementing the loyalty program."

#### Comparison Insights
How segments differ:
> "Enterprise customers spend 4.2x more per order than SMB customers."
> "West region outperforms East region by 35% in conversion rate."

#### Trend Insights
What's changing over time:
> "Mobile orders increased from 12% to 47% of total orders over 18 months."
> "Average order value peaked in Q4 at $156, compared to $112 annual average."

#### Risk Insights
Warning signs and concerns:
> "Three of top 10 customers reduced orders by >50% this quarter."
> "Inventory turnover dropped 30%, indicating potential overstock."

#### Opportunity Insights
Potential for growth or improvement:
> "Cross-sell rate for Product A is only 8%, compared to 28% category average."
> "Untapped market segment shows 3x growth rate with minimal coverage."

### 3. Insight Quality Criteria

Good insights are:

**Specific**: Include actual numbers
- Bad: "Revenue increased"
- Good: "Revenue increased 23% from $4.2M to $5.2M"

**Contextual**: Provide comparison points
- Bad: "We have 1,200 customers"
- Good: "Customer count grew 15% to 1,200, vs. 8% industry average"

**Actionable**: Suggest what to do
- Bad: "Conversion rate varies by channel"
- Good: "Email conversion is 2.3x higher than social - consider reallocating ad spend"

**Relevant**: Connect to business goals
- Bad: "The median is 45"
- Good: "Half of orders are under $45, suggesting opportunity for upselling"

## Insight Generation Process

### Step 1: Understand the Business Context

Before generating insights, consider:
- What question was the user trying to answer?
- What decisions might they make based on this?
- What's the business domain?

### Step 2: Analyze the Numbers

Look at the data systematically:
- What are the highest and lowest values?
- What percentage does each segment represent?
- How do values compare to averages?
- What changed over time?

### Step 3: Find the Story

Connect patterns to meaning:
- Why might this pattern exist?
- What could be causing this?
- What implications does this have?

### Step 4: Prioritize Insights

Rank insights by:
1. **Impact**: How significant is this finding?
2. **Actionability**: Can something be done about it?
3. **Urgency**: Does this require immediate attention?
4. **Confidence**: How reliable is this conclusion?

### Step 5: Frame for Action

For each insight, consider:
- What should the reader do differently?
- What additional analysis would help?
- What questions does this raise?

## Output Format

```markdown
## Business Insights: [Topic]

### Key Finding
[The single most important insight - bolded and specific]

### Performance Summary
- [Metric 1]: [Value with context]
- [Metric 2]: [Value with context]
- [Metric 3]: [Value with context]

### Insights

#### 1. [Category]: [Insight Title]
[Specific insight with numbers]
**Implication**: [What this means]
**Recommended Action**: [What to do]

#### 2. [Category]: [Insight Title]
[Specific insight with numbers]
**Implication**: [What this means]
**Recommended Action**: [What to do]

#### 3. [Category]: [Insight Title]
[Specific insight with numbers]
**Implication**: [What this means]
**Recommended Action**: [What to do]

### Risks to Monitor
- [Risk 1 with trigger condition]
- [Risk 2 with trigger condition]

### Recommended Next Steps
1. [Action 1]
2. [Action 2]
3. [Suggested follow-up analysis]
```

## Example Insights

### Revenue Analysis
> **Key Finding**: The top 3 customers represent 45% of total revenue, creating significant concentration risk. Customer #2's orders dropped 30% last quarter.
>
> **Insight 1 (Concentration)**: Revenue is highly concentrated - top 10% of customers drive 72% of revenue
> - Implication: Business is vulnerable to customer churn
> - Action: Implement customer health scoring and proactive retention for top accounts
>
> **Insight 2 (Trend)**: Q4 revenue was 40% higher than other quarters, indicating strong seasonality
> - Implication: Cash flow and resource planning needs to account for seasonal swings
> - Action: Build inventory reserves before Q4, consider seasonal promotions in Q2

### Customer Analysis
> **Key Finding**: Customer acquisition cost increased 45% while lifetime value remained flat, indicating deteriorating unit economics.
>
> **Insight 1 (Efficiency)**: Paid social CAC is 3x email CAC with similar conversion rates
> - Implication: Marketing spend is not optimally allocated
> - Action: Shift 20% of paid social budget to email marketing

## Integration

Insights work best when combined with:
- `/quarri-analyze`: Statistical foundation for insights
- `/quarri-chart`: Visual support for key findings
- `/quarri-query`: Additional data to validate hypotheses
