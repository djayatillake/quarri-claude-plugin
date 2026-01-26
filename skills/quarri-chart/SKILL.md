---
description: Generate interactive Plotly charts and open them in the browser
globs:
alwaysApply: false
---

# /quarri-chart - Interactive Chart Generation

Generate data visualizations as interactive HTML files and open them in the default browser.

## When to Use

Use `/quarri-chart` when users want visualizations:
- "Create a chart of revenue by month"
- "Visualize customer distribution"
- "Show me a graph of this data"
- "Chart sales by category"

## Primary Workflow (DEFAULT)

### Step 1: Query the data
```sql
SELECT category, SUM(sales) as total_sales
FROM orders
GROUP BY category
ORDER BY total_sales DESC
```

### Step 2: Generate HTML with Plotly
Write an HTML file to `/tmp/quarri_chart.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>[Chart Title]</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #1a1a2e; text-align: center; margin-bottom: 10px; }
        .subtitle { color: #666; text-align: center; margin-bottom: 30px; }
        #chart { width: 100%; max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; }
    </style>
</head>
<body>
    <h1>[Chart Title]</h1>
    <p class="subtitle">Data from [database_name]</p>
    <div id="chart"></div>
    <script>
        var data = [{
            x: [/* labels */],
            y: [/* values */],
            type: 'bar',
            marker: { color: '#4F46E5' }
        }];

        var layout = {
            title: '',
            xaxis: { title: '[X Label]' },
            yaxis: { title: '[Y Label]', tickformat: '$,.0f' },
            margin: { t: 40, b: 60, l: 80, r: 40 }
        };

        var config = { responsive: true, displayModeBar: true };
        Plotly.newPlot('chart', data, layout, config);
    </script>
</body>
</html>
```

### Step 3: Open in browser
```bash
open /tmp/quarri_chart.html
```

On different platforms:
- **macOS**: `open /tmp/quarri_chart.html`
- **Linux**: `xdg-open /tmp/quarri_chart.html`
- **Windows**: `start /tmp/quarri_chart.html`

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
var data = [{
    x: ['Category A', 'Category B', 'Category C'],
    y: [450000, 380000, 290000],
    type: 'bar',
    marker: {
        color: ['#4F46E5', '#7C3AED', '#A78BFA']
    },
    text: ['$450K', '$380K', '$290K'],
    textposition: 'auto'
}];

var layout = {
    title: 'Sales by Category',
    xaxis: { title: 'Category' },
    yaxis: { title: 'Sales ($)', tickformat: '$,.0f' }
};
```

### Horizontal Bar (many categories)
```javascript
var data = [{
    y: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
    x: [85000, 72000, 65000, 58000, 45000],
    type: 'bar',
    orientation: 'h',
    marker: { color: '#4F46E5' }
}];

var layout = {
    title: 'Top Products by Revenue',
    xaxis: { title: 'Revenue ($)', tickformat: '$,.0f' },
    margin: { l: 120 }
};
```

### Line Chart (time series)
```javascript
var data = [{
    x: ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'],
    y: [120000, 135000, 128000, 145000, 160000, 175000],
    type: 'scatter',
    mode: 'lines+markers',
    line: { color: '#4F46E5', width: 3 },
    marker: { size: 8 }
}];

var layout = {
    title: 'Monthly Revenue Trend',
    xaxis: { title: 'Month' },
    yaxis: { title: 'Revenue ($)', tickformat: '$,.0f' }
};
```

### Multi-Line Chart
```javascript
var data = [
    {
        x: ['Jan', 'Feb', 'Mar', 'Apr'],
        y: [100, 120, 115, 140],
        name: 'Product A',
        type: 'scatter',
        mode: 'lines+markers'
    },
    {
        x: ['Jan', 'Feb', 'Mar', 'Apr'],
        y: [80, 95, 110, 120],
        name: 'Product B',
        type: 'scatter',
        mode: 'lines+markers'
    }
];

var layout = {
    title: 'Product Comparison',
    xaxis: { title: 'Month' },
    yaxis: { title: 'Sales' }
};
```

### Pie/Donut Chart
```javascript
var data = [{
    labels: ['Technology', 'Furniture', 'Office Supplies'],
    values: [5471124, 4730801, 4144724],
    type: 'pie',
    hole: 0.4,  // Remove for regular pie
    marker: {
        colors: ['#4F46E5', '#10B981', '#F59E0B']
    },
    textinfo: 'label+percent'
}];

var layout = {
    title: 'Sales Distribution by Category'
};
```

### Scatter Plot
```javascript
var data = [{
    x: [/* x values */],
    y: [/* y values */],
    mode: 'markers',
    type: 'scatter',
    marker: {
        size: 10,
        color: '#4F46E5',
        opacity: 0.7
    }
}];

var layout = {
    title: 'Correlation Analysis',
    xaxis: { title: 'Variable X' },
    yaxis: { title: 'Variable Y' }
};
```

### Grouped Bar Chart
```javascript
var data = [
    {
        x: ['Q1', 'Q2', 'Q3', 'Q4'],
        y: [120, 150, 180, 200],
        name: '2023',
        type: 'bar'
    },
    {
        x: ['Q1', 'Q2', 'Q3', 'Q4'],
        y: [140, 165, 195, 220],
        name: '2024',
        type: 'bar'
    }
];

var layout = {
    title: 'Year over Year Comparison',
    barmode: 'group'
};
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

## Complete Example

For "Show me sales by category":

```html
<!DOCTYPE html>
<html>
<head>
    <title>Sales by Category</title>
    <script src="https://cdn.plot.ly/plotly-2.27.0.min.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #1a1a2e; text-align: center; margin-bottom: 10px; }
        .subtitle { color: #666; text-align: center; margin-bottom: 30px; font-size: 14px; }
        #chart { width: 100%; max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 20px; }
    </style>
</head>
<body>
    <h1>Superstore Sales by Category</h1>
    <p class="subtitle">Total: $14.3M across 51,290 orders</p>
    <div id="chart"></div>
    <script>
        var data = [{
            x: ['Technology', 'Furniture', 'Office Supplies'],
            y: [5471124.24, 4730801.23, 4144724.04],
            type: 'bar',
            marker: {
                color: ['#4F46E5', '#7C3AED', '#A78BFA']
            },
            text: ['$5.47M', '$4.73M', '$4.14M'],
            textposition: 'outside',
            textfont: { size: 14, color: '#374151' }
        }];

        var layout = {
            xaxis: { title: 'Category', tickfont: { size: 12 } },
            yaxis: {
                title: 'Sales ($)',
                tickformat: '$,.0f',
                tickfont: { size: 11 }
            },
            margin: { t: 40, b: 80, l: 100, r: 40 },
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
        };

        var config = {
            responsive: true,
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d']
        };

        Plotly.newPlot('chart', data, layout, config);
    </script>
</body>
</html>
```

Then run:
```bash
open /tmp/quarri_chart.html
```

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
