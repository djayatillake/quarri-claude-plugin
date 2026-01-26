# Skill Test Scenarios

Test scenarios for the Quarri skills-first architecture, documenting expected skill chaining behavior.

## Skill Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Request                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Skill Router (Claude)                         │
│  Matches request to appropriate skill based on intent            │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ Simple Skills │    │  Orchestrator │    │  Root Cause   │
│               │    │    Skills     │    │    Skills     │
│ - query       │    │               │    │               │
│ - chart       │    │ - analyze     │    │ - diagnose    │
│ - explain     │    │   (chains to  │    │   (uses       │
│ - insights    │    │   query →     │    │   metric      │
│ - metric      │    │   insights →  │    │   trees)      │
│ - extract     │    │   chart)      │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
```

## Test Scenarios

### Category 1: Simple Queries (Single Skill)

| Request | Expected Skill | Expected Behavior |
|---------|----------------|-------------------|
| "Show revenue by region" | `/quarri-query` | Generate SQL, execute, return results |
| "What does this SQL do: SELECT ..." | `/quarri-explain` | Plain English explanation |
| "Create a bar chart of sales" | `/quarri-chart` | QuickChart URL + alternatives |
| "Define a metric for customer LTV" | `/quarri-metric` | Guided metric creation |

### Category 2: Analysis Requests (Orchestrated Skills)

| Request | Primary Skill | Chained Skills | Expected Behavior |
|---------|---------------|----------------|-------------------|
| "Analyze revenue trends" | `/quarri-analyze` | query → insights → chart | Full pipeline with stats and visualization |
| "Give me insights on customer orders" | `/quarri-analyze` | query → insights → chart | MECE breakdown + recommendations |
| "What's happening with our sales?" | `/quarri-analyze` | query → insights | Statistical analysis + business interpretation |

### Category 3: Root Cause Analysis (Diagnostic Skills)

| Request | Primary Skill | Expected Behavior |
|---------|---------------|-------------------|
| "Why did revenue drop last month?" | `/quarri-diagnose` | Metric tree decomposition, impact attribution, root cause identification |
| "What's causing churn to increase?" | `/quarri-diagnose` | Drill-down analysis with confidence level |
| "Why is conversion rate declining?" | `/quarri-diagnose` | Funnel analysis with recommendations |

### Category 4: Complex Multi-Skill Scenarios

#### Scenario A: "Analyze why revenue dropped and visualize the trend"
```
1. /quarri-diagnose (root cause)
   ├── Build revenue metric tree
   ├── Query components for current vs previous
   ├── Identify primary driver
   └── Generate hypothesis
2. /quarri-chart (visualization)
   └── Create trend chart showing decline
```

#### Scenario B: "Create a revenue metric and show me its components"
```
1. /quarri-metric (definition)
   ├── Define revenue metric
   └── Build metric tree
2. /quarri-query (data retrieval)
   └── Query each tree component
3. /quarri-insights (analysis)
   └── Statistical summary of each component
```

#### Scenario C: "Give me a full analysis of customer acquisition trends with recommendations"
```
1. /quarri-analyze (orchestrator)
   ├── /quarri-query
   │   └── SQL for acquisition by channel over time
   ├── /quarri-insights
   │   ├── Statistical analysis (trends, correlations)
   │   └── Business insights with recommendations
   └── /quarri-chart
       └── Multi-line chart by acquisition channel
```

#### Scenario D: "Why did conversion drop? Show me the funnel breakdown."
```
1. /quarri-diagnose (root cause)
   ├── Build conversion funnel metric tree
   ├── Compare current vs previous period
   ├── Identify stage with biggest drop
   └── Generate root cause hypothesis
2. /quarri-chart (visualization)
   └── Funnel chart or waterfall showing drop-off
```

## Expected Skill Selection Logic

### Keywords → Skill Mapping

| Keywords in Request | Likely Skill |
|---------------------|--------------|
| "show", "list", "get", "what is" | `/quarri-query` |
| "analyze", "trends", "insights", "patterns" | `/quarri-analyze` |
| "why", "cause", "reason", "explain (change)", "dropped", "increased" | `/quarri-diagnose` |
| "chart", "graph", "visualize", "plot" | `/quarri-chart` |
| "explain (SQL)", "what does this mean" | `/quarri-explain` |
| "define", "create metric", "KPI", "metric tree" | `/quarri-metric` |
| "statistics", "distribution", "correlation", "outliers" | `/quarri-insights` |
| "extract", "pipeline", "sync", "connector" | `/quarri-extract` |

### Complexity → Orchestration

| Request Complexity | Skill Pattern |
|--------------------|---------------|
| Simple data retrieval | Single skill (query) |
| Analysis with insights | Orchestrated (analyze) |
| Root cause investigation | Diagnostic (diagnose) |
| Multi-faceted request | Multiple skill calls |

## Validation Checklist

### For Each Test Scenario, Verify:

- [ ] Correct skill(s) selected based on request intent
- [ ] Skill chaining happens in correct order
- [ ] Data flows properly between chained skills
- [ ] Output format matches skill documentation
- [ ] Error handling works when a skill fails mid-chain
- [ ] MECE framework applied for complex "why" questions
- [ ] Metric trees used for diagnostic questions

### Output Quality Checks:

- [ ] Insights are specific (include numbers)
- [ ] Insights are contextual (include comparisons)
- [ ] Insights are actionable (include recommendations)
- [ ] Charts use appropriate format (QuickChart default)
- [ ] Root cause has confidence level
- [ ] Recommendations are prioritized (immediate vs short-term)

## Test Commands (When MCP Server Active)

```bash
# 1. Simple query
/quarri-query "show total revenue by month"

# 2. Full analysis (should chain: query → insights → chart)
/quarri-analyze "analyze customer order trends over the past 6 months"

# 3. Root cause (should use metric tree decomposition)
/quarri-diagnose "why did revenue drop last month?"

# 4. Statistical insights
/quarri-insights "what's the distribution of order values?"

# 5. Metric with tree
/quarri-metric "create a metric for customer lifetime value with its component drivers"

# 6. Chart with format options
/quarri-chart "create an ASCII chart of revenue by region"
```

## Known Limitations

1. **MCP Server Required**: Skills require active Quarri MCP connection
2. **Database Required**: Must have database selected via `quarri_select_database`
3. **Schema Awareness**: Complex queries need schema context from `quarri_get_schema`
4. **Metric Trees**: Diagnose skill works best when metric definitions exist

## Success Criteria

The skills-first architecture is working correctly when:

1. Simple queries (show X) go directly to `/quarri-query`
2. Analysis requests (analyze X) trigger the orchestration chain
3. Diagnostic questions (why did X) use metric tree decomposition
4. Chart output includes QuickChart URLs by default
5. MECE framework appears in complex analysis output
6. Root cause analysis includes confidence levels and recommendations
