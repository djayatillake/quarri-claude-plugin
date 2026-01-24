---
description: Recommend and generate chart configurations for data visualization
globs:
alwaysApply: false
---

# /quarri-chart - Chart Recommendation

Analyze data and recommend optimal chart types with complete Plotly configurations.

## When to Use

Use `/quarri-chart` when users want visualizations:
- "Create a chart of revenue by month"
- "Visualize customer distribution"
- "Show me a graph of this data"
- "What's the best way to display these results?"

## Chart Selection Logic

### Decision Tree

```
START: What is the primary analysis goal?

1. TRENDS OVER TIME?
   └─→ Is it a single series?
       ├─→ Yes: LINE CHART
       └─→ No: Multiple series?
           ├─→ Compare totals: STACKED AREA
           └─→ Compare trends: MULTI-LINE

2. COMPARING CATEGORIES?
   └─→ How many categories?
       ├─→ 2-7: BAR CHART (vertical)
       ├─→ 8-15: BAR CHART (horizontal)
       └─→ 15+: TOP N + "Other" grouping
   └─→ Comparing across dimensions?
       └─→ GROUPED or STACKED BAR

3. SHOWING DISTRIBUTION?
   └─→ Single variable?
       ├─→ Continuous: HISTOGRAM
       └─→ Categorical: BAR CHART (sorted)
   └─→ Compare distributions?
       └─→ BOX PLOT or VIOLIN

4. PARTS OF A WHOLE?
   └─→ How many parts?
       ├─→ 2-6: PIE CHART or DONUT
       └─→ 7+: STACKED BAR (100%)

5. RELATIONSHIP BETWEEN VARIABLES?
   └─→ Two numeric: SCATTER PLOT
   └─→ With grouping: SCATTER with colors
   └─→ Many points: DENSITY/HEATMAP

6. GEOGRAPHIC DATA?
   └─→ MAP (choropleth or bubble)

7. HIERARCHICAL DATA?
   └─→ TREEMAP or SUNBURST

DEFAULT: TABLE (when visualization unclear)
```

### Chart Type Specifications

#### Line Chart
**Use when**: Time series, trends, continuous change
```json
{
  "type": "scatter",
  "mode": "lines+markers",
  "line": {"width": 2},
  "marker": {"size": 6}
}
```

#### Bar Chart
**Use when**: Comparing categorical values
```json
{
  "type": "bar",
  "orientation": "v",
  "marker": {"color": "#4F46E5"}
}
```

#### Horizontal Bar
**Use when**: Many categories, long labels
```json
{
  "type": "bar",
  "orientation": "h",
  "marker": {"color": "#4F46E5"}
}
```

#### Pie Chart
**Use when**: Parts of whole (< 7 categories)
```json
{
  "type": "pie",
  "hole": 0.4,
  "textposition": "auto"
}
```

#### Scatter Plot
**Use when**: Relationship between two variables
```json
{
  "type": "scatter",
  "mode": "markers",
  "marker": {"size": 10, "opacity": 0.7}
}
```

#### Area Chart
**Use when**: Cumulative values over time
```json
{
  "type": "scatter",
  "fill": "tozeroy",
  "line": {"width": 0.5}
}
```

## Chart Configuration Template

Generate complete Plotly configuration:

```json
{
  "data": [
    {
      "type": "bar",
      "x": ["Category A", "Category B", "Category C"],
      "y": [100, 200, 150],
      "name": "Series 1",
      "marker": {
        "color": "#4F46E5"
      }
    }
  ],
  "layout": {
    "title": {
      "text": "Chart Title",
      "font": {"size": 16}
    },
    "xaxis": {
      "title": "X Axis Label",
      "tickangle": -45
    },
    "yaxis": {
      "title": "Y Axis Label",
      "tickformat": ",.0f"
    },
    "showlegend": true,
    "legend": {
      "orientation": "h",
      "y": -0.2
    },
    "margin": {"l": 60, "r": 30, "t": 50, "b": 80},
    "plot_bgcolor": "white",
    "paper_bgcolor": "white"
  }
}
```

## Formatting Guidelines

### Number Formatting
- **Currency**: `"$,.2f"` → $1,234.56
- **Percentage**: `".1%"` → 45.6%
- **Large numbers**: `",.0f"` → 1,234,567
- **Compact**: `".2s"` → 1.2M

### Date Formatting
- **Full date**: `"%Y-%m-%d"` → 2024-01-15
- **Month-Year**: `"%b %Y"` → Jan 2024
- **Quarter**: `"Q%q %Y"` → Q1 2024

### Color Palettes
```javascript
// Sequential (single metric)
['#E0E7FF', '#A5B4FC', '#818CF8', '#6366F1', '#4F46E5']

// Categorical (multiple series)
['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

// Diverging (positive/negative)
['#EF4444', '#FCA5A5', '#E5E7EB', '#86EFAC', '#22C55E']
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

4. **Generate configuration**:
   - Build complete Plotly spec
   - Apply appropriate formatting
   - Set responsive defaults

5. **Present to user**:
   - Show chart rationale
   - Include configuration for rendering

## Output Format

```markdown
## Chart Recommendation

### Analysis
- Data: [rows] rows, [columns] columns
- Question type: [trend/comparison/distribution/etc.]
- Key columns: [list]

### Recommended Chart: [Type]
**Why**: [Brief rationale]

### Configuration
```json
[Complete Plotly configuration]
```

### Alternatives
- [Alternative 1]: [When it might be better]
- [Alternative 2]: [When it might be better]
```

## Integration with Canvas

Charts can be saved to Quarri Canvas:

```javascript
// After generating chart config
quarri_create_chart_panel({
  canvas_id: 123,
  title: "Chart Title",
  sql_query: "SELECT ...",
  chart_config: { /* Plotly config */ }
})
```

## Error Handling

- **Too many data points**: Aggregate or sample data
- **Missing values**: Note gaps, use appropriate handling
- **Single value**: Suggest metrics or KPI display instead
- **All nulls**: Report data quality issue
