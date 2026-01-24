---
description: Perform statistical analysis on data with Python code generation
globs:
alwaysApply: false
---

# /quarri-stats - Statistical Analysis

Perform statistical analysis on query results, generating and executing Python code for advanced statistics.

## When to Use

Use `/quarri-stats` when users need statistical analysis:
- "What's the distribution of order values?"
- "Is there a correlation between price and quantity?"
- "Show me the statistical summary of this data"
- "Identify outliers in customer spending"

## Analysis Types

### 1. Descriptive Statistics

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

### 2. Distribution Analysis

Analyze how values are distributed:
- **Histogram bins**: Frequency distribution
- **Normality test**: Shapiro-Wilk or D'Agostino
- **Distribution fit**: Best-fit distribution type

```python
from scipy import stats

def distribution_analysis(df, column):
    data = df[column].dropna()

    # Histogram data
    hist, bin_edges = np.histogram(data, bins='auto')

    # Normality test
    if len(data) >= 20:
        stat, p_value = stats.shapiro(data[:5000])  # Limit for performance
        is_normal = p_value > 0.05
    else:
        is_normal = None

    return {
        'histogram': {'counts': hist.tolist(), 'edges': bin_edges.tolist()},
        'is_normal': is_normal,
        'normality_p_value': p_value if len(data) >= 20 else None
    }
```

### 3. Correlation Analysis

Find relationships between numeric columns:
- **Pearson correlation**: Linear relationships
- **Spearman correlation**: Monotonic relationships
- **Correlation matrix**: All pairwise correlations

```python
def correlation_analysis(df, columns):
    numeric_df = df[columns].select_dtypes(include=[np.number])

    pearson = numeric_df.corr(method='pearson')
    spearman = numeric_df.corr(method='spearman')

    # Find strong correlations (|r| > 0.5)
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

### 4. Outlier Detection

Identify unusual values:
- **Z-score method**: Values > 3 std from mean
- **IQR method**: Values outside 1.5*IQR from quartiles
- **Modified Z-score**: Robust to extreme outliers

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

### 5. Time Series Analysis

For time-based data:
- **Trend detection**: Linear regression on time
- **Seasonality**: Periodic patterns
- **Growth rate**: Period-over-period changes

```python
def time_series_analysis(df, date_column, value_column):
    # Sort by date
    df_sorted = df.sort_values(date_column)

    # Calculate period-over-period change
    df_sorted['pct_change'] = df_sorted[value_column].pct_change()

    # Linear trend
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

### 6. Segment Comparison

Compare groups within data:
- **Group statistics**: Mean, median by group
- **Statistical tests**: t-test, ANOVA for differences
- **Effect size**: Cohen's d for magnitude

```python
def segment_comparison(df, group_column, value_column):
    groups = df.groupby(group_column)[value_column]

    group_stats = groups.agg(['count', 'mean', 'median', 'std']).to_dict('index')

    # ANOVA test if multiple groups
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

## Workflow

1. **Receive data**: Either from a previous query or via `quarri_execute_sql`
2. **Identify analysis type**: Based on data shape and user question
3. **Generate Python code**: Create analysis code for the specific case
4. **Execute locally**: Run the Python analysis
5. **Present findings**: Format results clearly with interpretations

## Output Format

```markdown
## Statistical Analysis: [Data Description]

### Data Overview
- Rows: [count]
- Numeric columns: [list]
- Categorical columns: [list]

### [Analysis Type 1]
[Results with interpretations]

### [Analysis Type 2]
[Results with interpretations]

### Key Statistical Findings
1. [Finding with specific numbers]
2. [Finding with specific numbers]
3. [Finding with specific numbers]

### Generated Code
[Python code block for reproducibility]
```

## Integration

This skill works well with:
- `/quarri-query`: Get data first, then analyze
- `/quarri-chart`: Visualize statistical findings
- `/quarri-insights`: Generate business insights from stats
