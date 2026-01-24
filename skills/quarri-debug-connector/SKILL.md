---
description: Debug and heal failing data extraction connectors
globs:
alwaysApply: false
---

# /quarri-debug-connector - Connector Healing

Debug and fix failing data extraction connectors by retrieving their code, running locally, identifying errors, and submitting healed versions.

## When to Use

Use `/quarri-debug-connector` when:
- A scheduled extraction job is failing
- Users report data not updating
- Connector logs show errors
- Pipeline needs updates for API changes

## Debugging Workflow

### Step 1: Identify the Problem

Get information about the failing connector:

```
quarri_get_connector_logs({
    connector_id: "stripe_connector_123",
    lines: 100
})
```

This returns:
- Recent execution logs
- Error messages
- Last successful run timestamp
- Configuration details

### Step 2: Retrieve Connector Code

Get the current connector source:

```
quarri_get_connector_code({
    connector_id: "stripe_connector_123"
})
```

Returns the full Python pipeline code.

### Step 3: Analyze the Error

Common error categories:

#### Authentication Errors
```
401 Unauthorized
403 Forbidden
Invalid API key
Token expired
```

**Diagnosis**: Check if API credentials are valid/expired

**Fix**: Update credentials or refresh OAuth tokens

#### API Changes
```
404 Not Found - endpoint /v1/old_endpoint
Field 'old_field' not found
```

**Diagnosis**: API version changed or endpoint deprecated

**Fix**: Update endpoint paths and field mappings

#### Rate Limiting
```
429 Too Many Requests
Rate limit exceeded
```

**Diagnosis**: Too many API calls

**Fix**: Add rate limiting, backoff logic

#### Data Format Changes
```
KeyError: 'expected_field'
TypeError: cannot unpack
JSONDecodeError
```

**Diagnosis**: Response structure changed

**Fix**: Update parsing logic for new format

#### Network/Timeout
```
ConnectionError
Timeout
DNS resolution failed
```

**Diagnosis**: Network issues or long-running requests

**Fix**: Add retry logic, increase timeouts

### Step 4: Test Locally

Run the connector locally to reproduce and fix the issue:

1. **Set up environment**:
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate
pip install dlt requests
```

2. **Set credentials**:
```bash
export STRIPE_API_KEY="sk_test_..."
# or use .dlt/secrets.toml
```

3. **Run with debugging**:
```python
import dlt
import logging

# Enable detailed logging
logging.basicConfig(level=logging.DEBUG)

# Run pipeline with small dataset
pipeline = dlt.pipeline(
    pipeline_name="debug_stripe",
    destination="duckdb",  # Local for testing
    dataset_name="test"
)

# Test specific resource
source = stripe_source()
load_info = pipeline.run(source.with_resources("customers").add_limit(10))
print(load_info)
```

4. **Iterate on fixes**:
- Make changes to the code
- Test with small data samples
- Verify data loads correctly

### Step 5: Apply Fixes

Common fix patterns:

#### Add Retry Logic
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=60)
)
def fetch_data(url, headers):
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()
```

#### Handle Rate Limiting
```python
import time

def rate_limited_fetch(url, headers, calls_per_minute=60):
    response = requests.get(url, headers=headers)

    if response.status_code == 429:
        retry_after = int(response.headers.get('Retry-After', 60))
        time.sleep(retry_after)
        return rate_limited_fetch(url, headers)

    return response.json()
```

#### Update Field Mappings
```python
# Old
data['old_field_name']

# New - with fallback for backwards compatibility
data.get('new_field_name', data.get('old_field_name'))
```

#### Handle Missing Data
```python
@dlt.resource
def customers():
    for customer in fetch_customers():
        yield {
            'id': customer['id'],
            'name': customer.get('name', ''),  # Handle missing
            'email': customer.get('email'),    # Allow null
            'created_at': customer.get('created_at', datetime.now().isoformat())
        }
```

#### Update API Version
```python
# Old
base_url = "https://api.example.com/v1"

# New
base_url = "https://api.example.com/v2"

# Update endpoints
config = {
    "resources": [
        {
            "name": "customers",
            "endpoint": {
                "path": "customers",  # was: "v1/customers"
                "params": {"version": "2024-01"}
            }
        }
    ]
}
```

### Step 6: Validate Fix

Before submitting, validate thoroughly:

1. **Run full extraction** (not just sample):
```python
load_info = pipeline.run(source)
print(f"Loaded {load_info.load_packages[0].jobs} jobs")
```

2. **Verify data quality**:
```sql
-- Check row counts
SELECT COUNT(*) FROM test.customers;

-- Check for nulls in required fields
SELECT COUNT(*) FROM test.customers WHERE id IS NULL;

-- Verify date ranges
SELECT MIN(created_at), MAX(created_at) FROM test.customers;
```

3. **Compare with previous data**:
```sql
-- Ensure no data loss
SELECT
    'before' as source, COUNT(*) FROM production.customers
UNION ALL
SELECT
    'after' as source, COUNT(*) FROM test.customers;
```

### Step 7: Submit Healed Code

Once validated, submit the fix:

```
quarri_update_connector_code({
    connector_id: "stripe_connector_123",
    pipeline_code: "[full fixed Python code]",
    change_summary: "Fixed rate limiting by adding exponential backoff"
})
```

## Error Pattern Reference

### Authentication
| Error | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Invalid/expired credentials | Update API key |
| 403 Forbidden | Insufficient permissions | Check API scopes |
| OAuth token expired | Token TTL exceeded | Implement refresh flow |

### Rate Limiting
| Error | Cause | Fix |
|-------|-------|-----|
| 429 Too Many Requests | Exceeded rate limit | Add backoff/throttling |
| Quota exceeded | Daily/monthly limit hit | Batch requests, spread over time |

### Data Format
| Error | Cause | Fix |
|-------|-------|-----|
| KeyError | Missing field | Use .get() with default |
| TypeError | Wrong data type | Add type conversion |
| JSONDecodeError | Invalid JSON response | Handle non-JSON responses |

### Network
| Error | Cause | Fix |
|-------|-------|-----|
| ConnectionError | Network failure | Add retry logic |
| Timeout | Request too slow | Increase timeout, paginate |
| DNS error | Resolution failure | Check URL, add retry |

## Output Format

```markdown
## Connector Debug Report: [Connector Name]

### Error Summary
- **Status**: [Failing/Fixed]
- **Last Success**: [Timestamp]
- **Error Type**: [Category]
- **Error Message**: [Actual error]

### Root Cause Analysis
[Explanation of why the connector is failing]

### Fix Applied
```python
[Code changes - before/after]
```

### Validation Results
- Test run: [Success/Failure]
- Records loaded: [Count]
- Data quality: [Pass/Fail with details]

### Next Steps
- [ ] Submit healed code
- [ ] Monitor next scheduled run
- [ ] [Any additional actions]
```

## Best Practices

1. **Always test locally first** - Don't submit untested fixes
2. **Keep change logs** - Document what changed and why
3. **Preserve backwards compatibility** - Handle old and new formats when possible
4. **Add defensive coding** - Handle missing fields, rate limits, retries
5. **Monitor after fix** - Verify the next scheduled run succeeds
