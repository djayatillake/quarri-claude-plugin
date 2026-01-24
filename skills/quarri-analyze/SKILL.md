---
description: Run complete data analysis pipeline with statistics, charts, and insights
globs:
alwaysApply: false
---

# /quarri-analyze - Full Analysis Pipeline

Run a complete data analysis pipeline that generates SQL, executes it, performs statistical analysis, recommends charts, and generates business insights.

## When to Use

Use `/quarri-analyze` when users want comprehensive analysis:
- "Analyze our sales trends"
- "What's driving customer churn?"
- "Give me insights on revenue performance"
- "Help me understand our order patterns"

This is more powerful than `/quarri-query` as it provides statistics, visualizations, and actionable insights.

## Pipeline Stages

### Stage 1: Query Generation

Generate SQL from the analysis question:

1. Fetch schema using `quarri_get_schema`
2. Search for relevant metrics using `quarri_search_metrics`
3. Get applicable rules using `quarri_list_rules`
4. Generate SQL following star schema patterns
5. Execute using `quarri_execute_sql`

### Stage 2: Statistical Analysis

Analyze the query results to understand patterns:

**For Numeric Columns:**
- Calculate: count, mean, median, std, min, max, quartiles
- Identify outliers (values > 2 std from mean)
- Calculate coefficient of variation
- Detect skewness

**For Categorical Columns:**
- Calculate: unique count, mode, frequency distribution
- Identify concentration (top N % of total)

**For Time Series:**
- Calculate: trend direction, growth rate
- Identify: seasonality, peaks, troughs
- Compare: period-over-period changes

**Cross-Column Analysis:**
- Correlation between numeric columns
- Distribution of measures across categories
- Concentration analysis (Pareto/80-20)

### Stage 3: Chart Recommendation

Based on the data and question, recommend the optimal chart type:

**Decision Tree:**

```
Is this a time series question?
├── Yes → Line chart (or area if cumulative)
└── No → Is this comparing categories?
    ├── Yes → Are there many categories (>10)?
    │   ├── Yes → Horizontal bar chart
    │   └── No → Is there a ranking implied?
    │       ├── Yes → Bar chart (sorted)
    │       └── No → Column chart
    └── No → Is this showing distribution?
        ├── Yes → Histogram or box plot
        └── No → Is this showing parts of whole?
            ├── Yes → Pie chart (if <7 categories) or stacked bar
            └── No → Is this showing relationship?
                ├── Yes → Scatter plot
                └── No → Simple table
```

**Chart Configuration:**
Generate a Plotly chart configuration with:
- Appropriate chart type
- Clear title and axis labels
- Proper formatting (currency, percentages, dates)
- Reasonable dimensions and colors

### Stage 4: Insight Generation

Generate actionable business insights from the analysis:

**Pattern Recognition:**
- Identify the top performers and laggards
- Find significant outliers or anomalies
- Detect trends (growing, declining, stable)
- Spot concentration (few items driving results)

**Insight Categories:**
1. **Key Finding**: The most important takeaway
2. **Trends**: Direction and magnitude of changes
3. **Comparisons**: How segments differ
4. **Anomalies**: Unexpected values or patterns
5. **Recommendations**: Suggested actions or deeper analysis

**Insight Format:**
- Lead with the most important finding
- Use specific numbers (not "revenue increased" but "revenue increased 23%")
- Provide context ("compared to previous period", "vs. average")
- Be actionable where possible

## Workflow

```
1. Parse the analysis question
2. [Stage 1] Generate and execute SQL query
   - Show SQL and explain what it queries
3. [Stage 2] Perform statistical analysis on results
   - Identify key statistical patterns
4. [Stage 3] Determine appropriate visualization
   - Generate chart configuration
5. [Stage 4] Generate business insights
   - Synthesize findings into actionable insights
6. Present comprehensive analysis to user
```

## Example Interaction

**User**: "Analyze revenue trends by product category"

**Claude's Analysis**:

### SQL Query
```sql
SELECT
    DATE_TRUNC('month', order_date) as month,
    product_category,
    SUM(revenue) as total_revenue
FROM quarri.bridge
WHERE order_date >= DATE '2024-01-01'
GROUP BY month, product_category
ORDER BY month, product_category;
```

### Statistical Analysis
- **Total Revenue**: $4.2M across 5 categories
- **Top Category**: Electronics (42% of total)
- **Growth Rate**: +15% MoM average
- **Seasonality**: Peak in Q4 (holiday season)

### Recommended Chart
Line chart showing revenue trends by category over time, with:
- X-axis: Month
- Y-axis: Revenue
- Color: Product category
- Annotation: Notable peaks

### Key Insights
1. **Electronics dominates**: 42% of revenue from single category - diversification opportunity
2. **Q4 spike**: 35% of annual revenue in Q4 - plan inventory accordingly
3. **Clothing growing fastest**: +28% YoY vs. +15% average - invest in expansion
4. **Home goods declining**: -8% YoY - investigate root cause

## Output Format

Present analysis in this structure:

```markdown
## Analysis: [Question Summary]

### Query
[SQL in code block with brief explanation]

### Data Summary
[Row count, date range, key dimensions]

### Statistical Findings
[Bullet points of key statistics]

### Visualization
[Chart recommendation with rationale]
[If chart generated, include config for rendering]

### Insights
1. **[Key Finding]**: [Specific insight with numbers]
2. **[Trend/Pattern]**: [Description with context]
3. **[Recommendation]**: [Actionable suggestion]

### Suggested Follow-up
[Questions for deeper analysis]
```

## Error Handling

- If query returns no data, suggest adjusting filters
- If data is too sparse for statistics, note limitations
- If chart type unclear, present options to user
- Log analysis results for future reference (optional)
