---
description: Statistical analysis and business insights from data
globs:
alwaysApply: false
---

# /quarri-insights - Statistical Analysis & Business Insights

Perform statistical analysis on data and generate actionable business insights with recommendations.

## When to Use

Use `/quarri-insights` when users need:
- Statistical analysis: "What's the distribution of order values?"
- Business interpretation: "What insights can you give me from this data?"
- Correlation analysis: "Is there a relationship between price and quantity?"
- Actionable recommendations: "What should we do based on these numbers?"

## Part 1: Statistical Analysis

### Analysis Types

#### 1. Descriptive Statistics

For numeric columns, calculate:
- **Central tendency**: mean, median, mode
- **Spread**: std, variance, range, IQR
- **Shape**: skewness, kurtosis
- **Percentiles**: 25th, 50th, 75th, 90th, 95th, 99th

```python
import pandas as pd
import numpy as np

def descriptive_stats(df, column):
    return {
        'count': df[column].count(),
        'mean': df[column].mean(),
        'median': df[column].median(),
        'std': df[column].std(),
        'min': df[column].min(),
        'max': df[column].max(),
        'q25': df[column].quantile(0.25),
        'q75': df[column].quantile(0.75),
        'skew': df[column].skew(),
        'kurtosis': df[column].kurtosis()
    }
```

#### 2. Distribution Analysis

Analyze how values are distributed:
- **Histogram bins**: Frequency distribution
- **Normality test**: Shapiro-Wilk or D'Agostino
- **Distribution fit**: Best-fit distribution type

```python
from scipy import stats

def distribution_analysis(df, column):
    data = df[column].dropna()
    hist, bin_edges = np.histogram(data, bins='auto')

    if len(data) >= 20:
        stat, p_value = stats.shapiro(data[:5000])
        is_normal = p_value > 0.05
    else:
        is_normal = None
        p_value = None

    return {
        'histogram': {'counts': hist.tolist(), 'edges': bin_edges.tolist()},
        'is_normal': is_normal,
        'normality_p_value': p_value
    }
```

#### 3. Correlation Analysis

Find relationships between numeric columns:
- **Pearson correlation**: Linear relationships
- **Spearman correlation**: Monotonic relationships
- **Strong correlations**: |r| > 0.5

```python
def correlation_analysis(df, columns):
    numeric_df = df[columns].select_dtypes(include=[np.number])
    pearson = numeric_df.corr(method='pearson')
    spearman = numeric_df.corr(method='spearman')

    strong_correlations = []
    for i, col1 in enumerate(numeric_df.columns):
        for j, col2 in enumerate(numeric_df.columns):
            if i < j:
                r = pearson.loc[col1, col2]
                if abs(r) > 0.5:
                    strong_correlations.append({
                        'columns': [col1, col2],
                        'pearson_r': r,
                        'spearman_r': spearman.loc[col1, col2]
                    })

    return {
        'correlation_matrix': pearson.to_dict(),
        'strong_correlations': strong_correlations
    }
```

#### 4. Outlier Detection

Identify unusual values:
- **Z-score method**: Values > 3 std from mean
- **IQR method**: Values outside 1.5*IQR from quartiles

```python
def detect_outliers(df, column, method='iqr'):
    data = df[column].dropna()

    if method == 'zscore':
        z_scores = np.abs(stats.zscore(data))
        outliers = data[z_scores > 3]
    elif method == 'iqr':
        q1, q3 = data.quantile([0.25, 0.75])
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = data[(data < lower_bound) | (data > upper_bound)]

    return {
        'outlier_count': len(outliers),
        'outlier_percentage': len(outliers) / len(data) * 100,
        'outlier_values': outliers.head(20).tolist(),
        'bounds': {'lower': lower_bound, 'upper': upper_bound} if method == 'iqr' else None
    }
```

#### 5. Time Series Analysis

For time-based data:
- **Trend detection**: Linear regression on time
- **Growth rate**: Period-over-period changes
- **Volatility**: Coefficient of variation

```python
def time_series_analysis(df, date_column, value_column):
    df_sorted = df.sort_values(date_column)
    df_sorted['pct_change'] = df_sorted[value_column].pct_change()

    x = np.arange(len(df_sorted))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, df_sorted[value_column])

    trend_direction = 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'

    return {
        'trend_direction': trend_direction,
        'trend_slope': slope,
        'trend_r_squared': r_value ** 2,
        'average_growth_rate': df_sorted['pct_change'].mean(),
        'volatility': df_sorted[value_column].std() / df_sorted[value_column].mean()
    }
```

#### 6. Segment Comparison

Compare groups within data:
- **Group statistics**: Mean, median by group
- **Statistical tests**: t-test, ANOVA for differences
- **Effect size**: Cohen's d for magnitude

```python
def segment_comparison(df, group_column, value_column):
    groups = df.groupby(group_column)[value_column]
    group_stats = groups.agg(['count', 'mean', 'median', 'std']).to_dict('index')

    group_values = [group.values for name, group in groups]
    if len(group_values) >= 2:
        f_stat, p_value = stats.f_oneway(*group_values)
        significant_difference = p_value < 0.05
    else:
        f_stat, p_value = None, None
        significant_difference = None

    return {
        'group_statistics': group_stats,
        'anova_f_statistic': f_stat,
        'anova_p_value': p_value,
        'significant_difference': significant_difference
    }
```

## Part 2: Business Insight Generation

### Pattern Recognition

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

### Insight Categories

#### Key Finding
The single most important takeaway:
> "Electronics drives 68% of total revenue but represents only 25% of product categories."

#### Performance Insights
How things are performing:
> "Revenue grew 23% YoY, outpacing the industry average of 15%."

#### Comparison Insights
How segments differ:
> "Enterprise customers spend 4.2x more per order than SMB customers."

#### Trend Insights
What's changing over time:
> "Mobile orders increased from 12% to 47% of total orders over 18 months."

#### Risk Insights
Warning signs and concerns:
> "Three of top 10 customers reduced orders by >50% this quarter."

#### Opportunity Insights
Potential for growth or improvement:
> "Cross-sell rate for Product A is only 8%, compared to 28% category average."

### Insight Quality Criteria

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

## Workflow

1. **Receive data**: From a previous query or via `quarri_execute_sql`
2. **Identify analysis type**: Based on data shape and user question
3. **Perform statistical analysis**: Run appropriate calculations
4. **Generate insights**: Interpret results in business context
5. **Prioritize findings**: Rank by impact, actionability, urgency
6. **Frame recommendations**: Suggest specific actions

## Output Format

```markdown
## Analysis: [Data Description]

### Data Overview
- Rows: [count]
- Numeric columns: [list]
- Categorical columns: [list]
- Date range: [if applicable]

### Statistical Findings

#### Descriptive Statistics
| Metric | Value |
|--------|-------|
| Mean   | X     |
| Median | Y     |
| Std    | Z     |

#### Key Patterns
- [Pattern 1 with numbers]
- [Pattern 2 with numbers]
- [Pattern 3 with numbers]

### Business Insights

#### Key Finding
[The single most important insight - bolded and specific]

#### Insights

**1. [Category]: [Insight Title]**
[Specific insight with numbers]
- **Implication**: [What this means]
- **Recommended Action**: [What to do]

**2. [Category]: [Insight Title]**
[Specific insight with numbers]
- **Implication**: [What this means]
- **Recommended Action**: [What to do]

### Risks to Monitor
- [Risk 1 with trigger condition]
- [Risk 2 with trigger condition]

### Recommended Next Steps
1. [Action 1]
2. [Action 2]
3. [Suggested follow-up analysis]
```

## Integration

This skill works well with:
- `/quarri-query`: Get data first, then analyze
- `/quarri-chart`: Visualize statistical findings
- `/quarri-analyze`: Called as part of the full analysis pipeline
