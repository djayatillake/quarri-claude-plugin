---
description: Generate interactive Plotly charts as HTML files
globs:
alwaysApply: false
---

# /quarri-chart - Interactive Chart Generation

Generate data visualizations as interactive **Plotly.js** HTML files that open in the browser.

**IMPORTANT**: Always generate HTML files with Plotly.js from CDN. Do NOT generate React components, inline JSON, or any other format.

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
SELECT product_name, SUM(sales) FROM quarri.schema GROUP BY product_name

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
SELECT order_date, SUM(sales) FROM quarri.schema GROUP BY order_date

-- GOOD: Aggregate to months
SELECT DATE_TRUNC('month', order_date) as month, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month
```

## Primary Workflow

### Step 1: Query the data (with appropriate aggregation)

Use `quarri_execute_sql` to get the data:

```sql
SELECT category, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY category
ORDER BY total_sales DESC
LIMIT 20
```

### Step 2: Generate HTML file with Plotly

Write an HTML file that:
1. Loads Plotly.js from CDN
2. Embeds the query results as a JavaScript data array
3. Builds Plotly traces from the data
4. Renders the chart

### Step 3: Open in browser

Use `open <filepath>` (macOS) or `xdg-open <filepath>` (Linux) to display the chart.

## HTML Template

Use this template structure for all charts:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CHART_TITLE</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>CHART_TITLE</h1>
  <div id="chart"></div>
  <script>
    // Data from query results
    const data = DATA_ARRAY;

    // Build Plotly traces
    const traces = [TRACE_CONFIG];

    // Layout configuration
    const layout = LAYOUT_CONFIG;

    // Render chart
    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

## Complete Examples

### Bar Chart Example

**Query:**
```sql
SELECT category, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY category
ORDER BY total_sales DESC
```

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales by Category</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Sales by Category</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { category: "Technology", total_sales: 836154.03 },
      { category: "Furniture", total_sales: 741999.80 },
      { category: "Office Supplies", total_sales: 719047.03 }
    ];

    const traces = [{
      x: data.map(d => d.category),
      y: data.map(d => d.total_sales),
      type: 'bar',
      marker: { color: '#4F46E5' },
      text: data.map(d => '$' + (d.total_sales / 1000).toFixed(0) + 'K'),
      textposition: 'auto'
    }];

    const layout = {
      xaxis: { title: 'Category' },
      yaxis: { title: 'Sales ($)', tickformat: '$,.0f' },
      margin: { t: 20, r: 20, b: 60, l: 80 }
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

### Line Chart Example (Time Series)

**Query:**
```sql
SELECT DATE_TRUNC('month', order_date) as month, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month
```

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monthly Sales Trend</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Monthly Sales Trend</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { month: "2021-01-01", total_sales: 94925.57 },
      { month: "2021-02-01", total_sales: 59751.25 },
      { month: "2021-03-01", total_sales: 115973.79 }
      // ... more data points
    ];

    const traces = [{
      x: data.map(d => d.month),
      y: data.map(d => d.total_sales),
      type: 'scatter',
      mode: 'lines+markers',
      line: { color: '#4F46E5', width: 3 },
      marker: { size: 8 }
    }];

    const layout = {
      xaxis: { title: 'Month' },
      yaxis: { title: 'Sales ($)', tickformat: '$,.0f' },
      margin: { t: 20, r: 20, b: 60, l: 80 }
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

### Multi-Series Line Chart

**Query:**
```sql
SELECT DATE_TRUNC('month', order_date) as month, category, SUM(sales) as total_sales
FROM quarri.schema
GROUP BY DATE_TRUNC('month', order_date), category
ORDER BY month, category
```

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Trend by Category</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Sales Trend by Category</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { month: "2021-01-01", category: "Furniture", total_sales: 28262.03 },
      { month: "2021-01-01", category: "Office Supplies", total_sales: 21879.28 },
      { month: "2021-01-01", category: "Technology", total_sales: 44784.26 }
      // ... more data points
    ];

    // Group by category
    const categories = [...new Set(data.map(d => d.category))];
    const colors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    const traces = categories.map((cat, i) => {
      const catData = data.filter(d => d.category === cat);
      return {
        x: catData.map(d => d.month),
        y: catData.map(d => d.total_sales),
        name: cat,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: colors[i % colors.length], width: 2 }
      };
    });

    const layout = {
      xaxis: { title: 'Month' },
      yaxis: { title: 'Sales ($)', tickformat: '$,.0f' },
      margin: { t: 20, r: 20, b: 60, l: 80 },
      legend: { orientation: 'h', y: -0.15 }
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

### Horizontal Bar Chart (Many Categories)

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Top 10 Products by Sales</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Top 10 Products by Sales</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { product_name: "Canon imageCLASS 2200", total_sales: 61599.82 },
      { product_name: "Fellowes PB500", total_sales: 27453.38 }
      // ... more products
    ];

    // Reverse for horizontal bar (top item at top)
    const sorted = [...data].reverse();

    const traces = [{
      y: sorted.map(d => d.product_name),
      x: sorted.map(d => d.total_sales),
      type: 'bar',
      orientation: 'h',
      marker: { color: '#4F46E5' }
    }];

    const layout = {
      xaxis: { title: 'Sales ($)', tickformat: '$,.0f' },
      margin: { t: 20, r: 20, b: 60, l: 200 }
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

### Pie/Donut Chart

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Distribution</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Sales Distribution by Category</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { category: "Technology", total_sales: 836154.03 },
      { category: "Furniture", total_sales: 741999.80 },
      { category: "Office Supplies", total_sales: 719047.03 }
    ];

    const traces = [{
      labels: data.map(d => d.category),
      values: data.map(d => d.total_sales),
      type: 'pie',
      hole: 0.4,
      marker: { colors: ['#4F46E5', '#10B981', '#F59E0B'] },
      textinfo: 'label+percent'
    }];

    const layout = {
      margin: { t: 20, r: 20, b: 20, l: 20 },
      showlegend: true
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

### Grouped Bar Chart

**HTML file to write:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Year over Year Comparison</title>
  <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
    #chart { width: 100%; height: 600px; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    h1 { color: #1e293b; font-size: 1.5rem; margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Year over Year Comparison</h1>
  <div id="chart"></div>
  <script>
    const data = [
      { year: 2023, quarter: "Q1", sales: 120000 },
      { year: 2023, quarter: "Q2", sales: 150000 },
      { year: 2024, quarter: "Q1", sales: 140000 },
      { year: 2024, quarter: "Q2", sales: 165000 }
    ];

    const years = [...new Set(data.map(d => d.year))];
    const colors = ['#4F46E5', '#10B981'];

    const traces = years.map((year, i) => {
      const yearData = data.filter(d => d.year === year);
      return {
        x: yearData.map(d => d.quarter),
        y: yearData.map(d => d.sales),
        name: String(year),
        type: 'bar',
        marker: { color: colors[i] }
      };
    });

    const layout = {
      barmode: 'group',
      xaxis: { title: 'Quarter' },
      yaxis: { title: 'Sales ($)', tickformat: '$,.0f' },
      margin: { t: 20, r: 20, b: 60, l: 80 }
    };

    Plotly.newPlot('chart', traces, layout, { responsive: true });
  </script>
</body>
</html>
```

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

## File Output

**Always write to a descriptive filename:**
```
/tmp/quarri-chart-sales-by-category.html
/tmp/quarri-chart-monthly-trend.html
/tmp/quarri-chart-top-products.html
```

**Then open in browser:**
```bash
# macOS
open /tmp/quarri-chart-sales-by-category.html

# Linux
xdg-open /tmp/quarri-chart-sales-by-category.html
```

## Validation Checklist

Before generating a chart, verify:

1. **Format**: Generating an HTML file with Plotly.js from CDN
2. **Data embedded**: Query results are in a `const data = [...]` JavaScript array
3. **Data points**: ≤ 500 points total (aggregate or sample if more)
4. **Categories**: ≤ 20 categories (use Top N + Other if more)
5. **Time granularity**: Appropriate for date range (don't show daily for multi-year)
6. **Aggregation**: Never chart raw transactions - always GROUP BY
7. **File written**: HTML file saved to /tmp/quarri-chart-*.html
8. **Browser opened**: File opened with `open` or `xdg-open`

## Integration

Charts work best when combined with:
- `/quarri-query`: Get data first, then visualize
- `/quarri-analyze`: Called as part of full analysis pipeline
- `/quarri-insights`: Visual support for statistical findings
