---
description: Generate interactive Plotly charts rendered as MCP UI resources
globs:
alwaysApply: false
---

# /quarri-chart - Interactive Chart Generation

Generate data visualizations as interactive **Plotly.js** charts using MCP UI resources.

**IMPORTANT**: Always use Plotly.js format. Do NOT generate React components, Recharts, Chart.js, or any other charting library. The MCP UI renderer only supports Plotly.js configuration objects.

## When to Use

Use `/quarri-chart` when users want visualizations:
- "Create a chart of revenue by month"
- "Visualize customer distribution"
- "Show me a graph of this data"
- "Chart sales by category"

## Data Size Limits

**CRITICAL**: Charts should contain at most **500 data points**. Large datasets must be handled appropriately:

| Scenario | Solution |
|----------|----------|
| Time series with many dates | Aggregate to appropriate granularity (day→week→month→quarter) |
| Too many categories | Show Top N (10-20) + "Other" bucket |
| Scatter plot with many points | Sample data or use density/heatmap |
| Raw transactional data | Always GROUP BY before charting - never chart individual transactions |

### Example: Handling Large Categorical Data

```sql
-- BAD: Returns potentially thousands of products
SELECT product_name, SUM(sales) FROM orders GROUP BY product_name

-- GOOD: Top 10 + Other
WITH ranked AS (
  SELECT product_name, SUM(sales) as total_sales,
         ROW_NUMBER() OVER (ORDER BY SUM(sales) DESC) as rn
  FROM quarri.schema
  GROUP BY product_name
)
SELECT
  CASE WHEN rn <= 10 THEN product_name ELSE 'Other' END as product_name,
  SUM(total_sales) as total_sales
FROM ranked
GROUP BY CASE WHEN rn <= 10 THEN product_name ELSE 'Other' END
ORDER BY total_sales DESC
```

### Example: Handling Long Time Series

```sql
-- BAD: Daily data for 5 years = 1800+ points
SELECT order_date, SUM(sales) FROM orders GROUP BY order_date

-- GOOD: Aggregate to months
SELECT DATE_TRUNC('month', order_date) as month, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month
```

## Primary Workflow

### Step 1: Query the data (with appropriate aggregation)
```sql
SELECT category, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY category
ORDER BY total_sales DESC
LIMIT 20
```

### Step 2: Return chart as MCP UI resource

After getting the data, construct a **Plotly.js** configuration and include it in your response. The chart will be rendered as an interactive UI component.

**Example Plotly config for bar chart:**
```json
{
  "data": [{
    "x": ["Category A", "Category B", "Category C"],
    "y": [450000, 380000, 290000],
    "type": "bar",
    "marker": { "color": "#4F46E5" }
  }],
  "layout": {
    "title": "Sales by Category",
    "xaxis": { "title": "Category" },
    "yaxis": { "title": "Sales ($)", "tickformat": "$,.0f" }
  }
}
```

The response should include this as a resource block with:
- URI: `ui://quarri/chart`
- MIME type: `application/vnd.quarri.chart+json`
- Content: JSON with `type: "chart"` and `plotly: { data, layout }`

## Chart Type Selection

### Decision Tree

```
START: What is the primary analysis goal?

1. TRENDS OVER TIME?
   └─→ Single series? → LINE CHART
   └─→ Multiple series? → MULTI-LINE
   └─→ Cumulative? → AREA CHART

2. COMPARING CATEGORIES?
   └─→ 2-7 categories → VERTICAL BAR
   └─→ 8-15 categories → HORIZONTAL BAR
   └─→ 15+ categories → TOP N + "Other"

3. SHOWING DISTRIBUTION?
   └─→ Continuous data → HISTOGRAM
   └─→ Categorical → BAR (sorted)

4. PARTS OF A WHOLE?
   └─→ 2-6 parts → PIE/DONUT
   └─→ 7+ parts → STACKED BAR

5. RELATIONSHIP BETWEEN VARIABLES?
   └─→ Two numeric → SCATTER PLOT
```

## Plotly Templates

### Bar Chart
```javascript
{
  "data": [{
    "x": ["Category A", "Category B", "Category C"],
    "y": [450000, 380000, 290000],
    "type": "bar",
    "marker": {
      "color": ["#4F46E5", "#7C3AED", "#A78BFA"]
    },
    "text": ["$450K", "$380K", "$290K"],
    "textposition": "auto"
  }],
  "layout": {
    "title": "Sales by Category",
    "xaxis": { "title": "Category" },
    "yaxis": { "title": "Sales ($)", "tickformat": "$,.0f" }
  }
}
```

### Horizontal Bar (many categories)
```javascript
{
  "data": [{
    "y": ["Product A", "Product B", "Product C", "Product D", "Product E"],
    "x": [85000, 72000, 65000, 58000, 45000],
    "type": "bar",
    "orientation": "h",
    "marker": { "color": "#4F46E5" }
  }],
  "layout": {
    "title": "Top Products by Revenue",
    "xaxis": { "title": "Revenue ($)", "tickformat": "$,.0f" },
    "margin": { "l": 120 }
  }
}
```

### Line Chart (time series)
```javascript
{
  "data": [{
    "x": ["2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06"],
    "y": [120000, 135000, 128000, 145000, 160000, 175000],
    "type": "scatter",
    "mode": "lines+markers",
    "line": { "color": "#4F46E5", "width": 3 },
    "marker": { "size": 8 }
  }],
  "layout": {
    "title": "Monthly Revenue Trend",
    "xaxis": { "title": "Month" },
    "yaxis": { "title": "Revenue ($)", "tickformat": "$,.0f" }
  }
}
```

### Multi-Line Chart
```javascript
{
  "data": [
    {
      "x": ["Jan", "Feb", "Mar", "Apr"],
      "y": [100, 120, 115, 140],
      "name": "Product A",
      "type": "scatter",
      "mode": "lines+markers"
    },
    {
      "x": ["Jan", "Feb", "Mar", "Apr"],
      "y": [80, 95, 110, 120],
      "name": "Product B",
      "type": "scatter",
      "mode": "lines+markers"
    }
  ],
  "layout": {
    "title": "Product Comparison",
    "xaxis": { "title": "Month" },
    "yaxis": { "title": "Sales" }
  }
}
```

### Pie/Donut Chart
```javascript
{
  "data": [{
    "labels": ["Technology", "Furniture", "Office Supplies"],
    "values": [5471124, 4730801, 4144724],
    "type": "pie",
    "hole": 0.4,
    "marker": {
      "colors": ["#4F46E5", "#10B981", "#F59E0B"]
    },
    "textinfo": "label+percent"
  }],
  "layout": {
    "title": "Sales Distribution by Category"
  }
}
```

### Scatter Plot
```javascript
{
  "data": [{
    "x": [/* x values */],
    "y": [/* y values */],
    "mode": "markers",
    "type": "scatter",
    "marker": {
      "size": 10,
      "color": "#4F46E5",
      "opacity": 0.7
    }
  }],
  "layout": {
    "title": "Correlation Analysis",
    "xaxis": { "title": "Variable X" },
    "yaxis": { "title": "Variable Y" }
  }
}
```

### Grouped Bar Chart
```javascript
{
  "data": [
    {
      "x": ["Q1", "Q2", "Q3", "Q4"],
      "y": [120, 150, 180, 200],
      "name": "2023",
      "type": "bar"
    },
    {
      "x": ["Q1", "Q2", "Q3", "Q4"],
      "y": [140, 165, 195, 220],
      "name": "2024",
      "type": "bar"
    }
  ],
  "layout": {
    "title": "Year over Year Comparison",
    "barmode": "group"
  }
}
```

## Color Palettes

```javascript
// Primary (single series)
const PRIMARY = '#4F46E5';

// Categorical (multiple series)
const CATEGORICAL = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Sequential (gradient)
const SEQUENTIAL = ['#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5', '#4338CA', '#3730A3'];

// Diverging (positive/negative)
const DIVERGING_NEG = '#EF4444';
const DIVERGING_POS = '#10B981';
```

## Number Formatting

```javascript
// Currency
tickformat: '$,.0f'      // $1,234,567
tickformat: '$,.2f'      // $1,234,567.89
tickformat: '$~s'        // $1.2M

// Percentages
tickformat: '.1%'        // 45.2%

// Large numbers
tickformat: '~s'         // 1.2M, 3.4K
```

## MCP UI Resource Format

The chart should be returned as an MCP UI resource with the following structure:

```json
{
  "type": "chart",
  "title": "Chart Title",
  "plotly": {
    "data": [/* Plotly data traces */],
    "layout": {/* Plotly layout config */}
  }
}
```

This is automatically rendered by Claude Code when you include the resource block in your response.

## Alternative Outputs

### QuickChart URL (for sharing/embedding)
When user specifically needs a URL:
```
https://quickchart.io/chart?c={type:'bar',data:{labels:['A','B','C'],datasets:[{data:[10,20,15]}]}}
```

### ASCII Chart (terminal only)
When user is in a terminal-only environment:
```
Sales by Category

Technology      |████████████████████████████████████████ $5.47M
Furniture       |██████████████████████████████████      $4.73M
Office Supplies |██████████████████████████████          $4.14M
                 0              $3M              $6M
```

## Integration

Charts work best when combined with:
- `/quarri-query`: Get data first, then visualize
- `/quarri-analyze`: Called as part of full analysis pipeline
- `/quarri-insights`: Visual support for statistical findings

## Validation Checklist

Before generating a chart, verify:

1. **Library**: Using Plotly.js format (NOT React, Recharts, Chart.js, D3, or others)
2. **Data points**: ≤ 500 points total (aggregate or sample if more)
3. **Categories**: ≤ 20 categories (use Top N + Other if more)
4. **Time granularity**: Appropriate for date range (don't show daily for multi-year)
5. **Aggregation**: Never chart raw transactions - always GROUP BY

**Output format must be:**
```json
{
  "data": [{ /* Plotly trace */ }],
  "layout": { /* Plotly layout */ }
}
```

**NOT:**
```jsx
// WRONG - Do not generate React components
<BarChart data={data}>
  <Bar dataKey="value" />
</BarChart>
```
