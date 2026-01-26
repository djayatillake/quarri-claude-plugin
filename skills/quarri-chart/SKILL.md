---
description: Generate charts in multiple formats - QuickChart URLs, matplotlib, or ASCII
globs:
alwaysApply: false
---

# /quarri-chart - Flexible Chart Generation

Generate data visualizations in multiple formats optimized for Claude Code users.

## When to Use

Use `/quarri-chart` when users want visualizations:
- "Create a chart of revenue by month"
- "Visualize customer distribution"
- "Show me a graph of this data"
- "What's the best way to display these results?"

## Output Formats

### 1. QuickChart URL (DEFAULT)

Generate a URL that renders instantly in any browser or terminal with image support.

**When to use**: Quick visualization, sharing, embedding in documents

```
https://quickchart.io/chart?c={encoded_config}
```

**Example**:
```
https://quickchart.io/chart?c={type:'bar',data:{labels:['Q1','Q2','Q3','Q4'],datasets:[{label:'Revenue',data:[120,150,180,200]}]}}
```

### 2. Matplotlib Code

Generate Python code that creates and saves chart images.

**When to use**: Custom styling, publication-quality charts, local files

```python
import matplotlib.pyplot as plt
import pandas as pd

# Data
categories = ['Q1', 'Q2', 'Q3', 'Q4']
values = [120, 150, 180, 200]

# Create figure
fig, ax = plt.subplots(figsize=(10, 6))
ax.bar(categories, values, color='#4F46E5')

# Styling
ax.set_xlabel('Quarter')
ax.set_ylabel('Revenue ($K)')
ax.set_title('Quarterly Revenue')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

# Save
plt.tight_layout()
plt.savefig('revenue_chart.png', dpi=150)
plt.show()
```

### 3. ASCII Chart

Terminal-friendly text visualization for quick inspection.

**When to use**: Terminal environments, quick data review, no graphics support

```
Revenue by Quarter

Q1 |████████████         | $120K
Q2 |███████████████      | $150K
Q3 |██████████████████   | $180K
Q4 |████████████████████ | $200K
    0        100       200
```

## Chart Selection Logic

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
   └─→ Multiple dimensions → GROUPED BAR

3. SHOWING DISTRIBUTION?
   └─→ Continuous data → HISTOGRAM
   └─→ Categorical → BAR (sorted)
   └─→ Compare groups → BOX PLOT

4. PARTS OF A WHOLE?
   └─→ 2-6 parts → PIE/DONUT
   └─→ 7+ parts → STACKED BAR (100%)

5. RELATIONSHIP BETWEEN VARIABLES?
   └─→ Two numeric → SCATTER PLOT
   └─→ With grouping → SCATTER with colors

DEFAULT: TABLE (when visualization unclear)
```

## QuickChart Configuration

### Bar Chart
```javascript
{
  type: 'bar',
  data: {
    labels: ['A', 'B', 'C'],
    datasets: [{
      label: 'Values',
      data: [10, 20, 15],
      backgroundColor: '#4F46E5'
    }]
  },
  options: {
    title: { display: true, text: 'Chart Title' },
    legend: { display: false }
  }
}
```

### Line Chart
```javascript
{
  type: 'line',
  data: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr'],
    datasets: [{
      label: 'Revenue',
      data: [100, 120, 115, 140],
      borderColor: '#4F46E5',
      fill: false
    }]
  }
}
```

### Horizontal Bar
```javascript
{
  type: 'horizontalBar',
  data: {
    labels: ['Product A', 'Product B', 'Product C'],
    datasets: [{
      data: [300, 250, 200],
      backgroundColor: ['#4F46E5', '#10B981', '#F59E0B']
    }]
  }
}
```

### Pie/Donut Chart
```javascript
{
  type: 'doughnut',
  data: {
    labels: ['Desktop', 'Mobile', 'Tablet'],
    datasets: [{
      data: [60, 30, 10],
      backgroundColor: ['#4F46E5', '#10B981', '#F59E0B']
    }]
  }
}
```

### Scatter Plot
```javascript
{
  type: 'scatter',
  data: {
    datasets: [{
      label: 'Data Points',
      data: [{x: 1, y: 2}, {x: 2, y: 4}, {x: 3, y: 3}],
      backgroundColor: '#4F46E5'
    }]
  }
}
```

## Matplotlib Templates

### Bar Chart
```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 6))
categories = ['A', 'B', 'C', 'D']
values = [25, 40, 30, 35]

bars = ax.bar(categories, values, color='#4F46E5', edgecolor='white')
ax.bar_label(bars, fmt='%.0f')

ax.set_ylabel('Value')
ax.set_title('Category Comparison')
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.savefig('bar_chart.png', dpi=150)
```

### Line Chart
```python
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

fig, ax = plt.subplots(figsize=(12, 6))
dates = ['2024-01', '2024-02', '2024-03', '2024-04']
values = [100, 120, 115, 140]

ax.plot(dates, values, marker='o', color='#4F46E5', linewidth=2, markersize=8)
ax.fill_between(dates, values, alpha=0.1, color='#4F46E5')

ax.set_ylabel('Revenue ($K)')
ax.set_title('Monthly Revenue Trend')
ax.grid(True, alpha=0.3)
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.savefig('line_chart.png', dpi=150)
```

### Horizontal Bar (for many categories)
```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(10, 8))
categories = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E']
values = [45, 38, 32, 28, 22]

bars = ax.barh(categories, values, color='#4F46E5')
ax.bar_label(bars, fmt='%.0f', padding=5)

ax.set_xlabel('Sales ($K)')
ax.set_title('Top Products by Sales')
ax.invert_yaxis()  # Largest at top
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

plt.tight_layout()
plt.savefig('horizontal_bar.png', dpi=150)
```

## ASCII Chart Generation

### Horizontal Bar (ASCII)
```
def ascii_bar_chart(data, title, max_width=40):
    """Generate ASCII horizontal bar chart"""
    print(f"\n{title}\n")
    max_val = max(data.values())

    for label, value in data.items():
        bar_len = int((value / max_val) * max_width)
        bar = '█' * bar_len
        print(f"{label:>15} |{bar} {value:,.0f}")

    print(f"{'':>15}  {'─' * max_width}")

# Example
data = {'Electronics': 45000, 'Clothing': 32000, 'Home': 28000}
ascii_bar_chart(data, "Revenue by Category")
```

**Output:**
```
Revenue by Category

    Electronics |████████████████████████████████████████ 45,000
       Clothing |████████████████████████████            32,000
           Home |████████████████████████                28,000
                 ────────────────────────────────────────
```

### Vertical Bar (ASCII)
```
def ascii_vertical_bar(data, title, height=10):
    """Generate ASCII vertical bar chart"""
    print(f"\n{title}\n")
    max_val = max(data.values())

    for row in range(height, 0, -1):
        line = ""
        for value in data.values():
            threshold = (row / height) * max_val
            line += "  █  " if value >= threshold else "     "
        print(f"{int(max_val * row / height):>6} |{line}")

    print(f"{'':>6} +{'─────' * len(data)}")
    labels = "".join(f"{k:^5}" for k in data.keys())
    print(f"{'':>8}{labels}")

# Example
data = {'Q1': 120, 'Q2': 150, 'Q3': 180, 'Q4': 200}
ascii_vertical_bar(data, "Quarterly Revenue")
```

### Sparkline (ASCII)
```
def ascii_sparkline(values, width=30):
    """Generate inline ASCII sparkline"""
    chars = '▁▂▃▄▅▆▇█'
    min_val, max_val = min(values), max(values)
    range_val = max_val - min_val or 1

    line = ""
    for v in values:
        idx = int((v - min_val) / range_val * (len(chars) - 1))
        line += chars[idx]

    return f"[{line}] {values[0]:,.0f} → {values[-1]:,.0f}"

# Example
monthly = [100, 105, 98, 112, 120, 118, 125, 130, 128, 140, 145, 155]
print(f"Revenue trend: {ascii_sparkline(monthly)}")
# Output: Revenue trend: [▁▂▁▃▄▄▅▆▅▇▇█] 100 → 155
```

## Workflow

1. **Analyze data shape**:
   - Count rows and columns
   - Identify column types (numeric, categorical, date)
   - Check value distributions

2. **Determine visualization goal**:
   - Parse user question for intent
   - Consider data characteristics

3. **Select chart type**:
   - Apply decision tree
   - Consider data density and readability

4. **Choose output format**:
   - Default: QuickChart URL (instant rendering)
   - If user needs customization: matplotlib code
   - If terminal-only: ASCII chart

5. **Generate and present**:
   - Show chart or URL
   - Include rationale
   - Suggest alternatives

## Output Format

```markdown
## Visualization: [Data Description]

### Analysis
- Data: [rows] rows, [columns] columns
- Question type: [trend/comparison/distribution/etc.]
- Key columns: [list]

### Recommended Chart: [Type]
**Why**: [Brief rationale]

### Chart

**QuickChart URL** (click to view):
[URL]

**Alternative: Matplotlib Code**
```python
[Code block]
```

**Alternative: ASCII Preview**
```
[ASCII chart]
```

### Alternatives
- [Alternative chart 1]: [When it might be better]
- [Alternative chart 2]: [When it might be better]
```

## Color Palettes

```python
# Primary palette
PRIMARY = '#4F46E5'  # Indigo

# Categorical (multiple series)
CATEGORICAL = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

# Sequential (single metric, gradient)
SEQUENTIAL = ['#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5']

# Diverging (positive/negative)
DIVERGING = ['#EF4444', '#FCA5A5', '#E5E7EB', '#86EFAC', '#22C55E']
```

## Integration

Charts work best when combined with:
- `/quarri-query`: Get data first, then visualize
- `/quarri-analyze`: Called as part of full analysis pipeline
- `/quarri-insights`: Visual support for statistical findings
