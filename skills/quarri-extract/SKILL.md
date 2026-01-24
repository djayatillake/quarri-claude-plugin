---
description: Build and test data extraction pipelines using dlt
globs:
alwaysApply: false
---

# /quarri-extract - Data Extraction Pipelines

Build data extraction pipelines using dlt (data load tool) for pulling data from APIs and other sources.

## When to Use

Use `/quarri-extract` when users need to set up data pipelines:
- "Set up extraction from Stripe"
- "Pull data from our Salesforce"
- "Create a pipeline for HubSpot data"
- "Build a custom API connector"

## Supported Sources

### Pre-built Connectors
- **Payments**: Stripe, Square, PayPal
- **CRM**: Salesforce, HubSpot, Pipedrive
- **Marketing**: Google Analytics, Facebook Ads, Mailchimp
- **Support**: Zendesk, Intercom, Freshdesk
- **E-commerce**: Shopify, WooCommerce
- **Databases**: PostgreSQL, MySQL, MongoDB

### Custom APIs
Build custom extractors for any REST API.

## Pipeline Architecture

### dlt Pipeline Structure

```python
import dlt
from dlt.sources.rest_api import rest_api_source

# Define the source
@dlt.source
def my_source(api_key: str):
    """Extract data from My API"""

    @dlt.resource(write_disposition="merge", primary_key="id")
    def customers():
        """Extract customer records"""
        response = requests.get(
            "https://api.example.com/customers",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        yield from response.json()["data"]

    @dlt.resource(write_disposition="append")
    def events():
        """Extract event records"""
        # Incremental loading
        response = requests.get(
            "https://api.example.com/events",
            params={"since": dlt.sources.incremental("created_at")}
        )
        yield from response.json()["data"]

    return customers, events

# Create and run pipeline
pipeline = dlt.pipeline(
    pipeline_name="my_pipeline",
    destination="motherduck",
    dataset_name="raw"
)

# Load data
load_info = pipeline.run(my_source(api_key="..."))
```

## Extraction Workflow

### Step 1: Discover Available Sources

List available data sources:
```
quarri_list_extraction_sources
```

Returns:
- Pre-built connectors
- Required credentials for each
- Available resources (tables/endpoints)

### Step 2: Configure Credentials

Store credentials securely:
```
quarri_configure_extraction({
    source_name: "stripe",
    credentials: {
        api_key: "sk_live_..."
    },
    resources: ["customers", "payments", "subscriptions"]
})
```

### Step 3: Discover Tables

Explore available data:
```
quarri_discover_tables({
    source_name: "stripe"
})
```

Returns available endpoints/tables with:
- Field names and types
- Primary keys
- Relationships

### Step 4: Generate Pipeline Code

Generate the extraction code:

```python
# Generated dlt pipeline for Stripe
import dlt
from dlt.sources.rest_api import rest_api_source

@dlt.source(name="stripe")
def stripe_source(api_key: str = dlt.secrets.value):
    """Extract data from Stripe API"""

    config = {
        "client": {
            "base_url": "https://api.stripe.com/v1",
            "auth": {"type": "bearer", "token": api_key}
        },
        "resources": [
            {
                "name": "customers",
                "endpoint": {"path": "customers"},
                "primary_key": "id",
                "write_disposition": "merge"
            },
            {
                "name": "payments",
                "endpoint": {
                    "path": "payment_intents",
                    "params": {"created[gte]": "{incremental.created}"}
                },
                "primary_key": "id",
                "write_disposition": "append"
            }
        ]
    }

    return rest_api_source(config)

if __name__ == "__main__":
    pipeline = dlt.pipeline(
        pipeline_name="stripe_pipeline",
        destination="motherduck",
        dataset_name="raw_stripe"
    )

    load_info = pipeline.run(stripe_source())
    print(load_info)
```

### Step 5: Test Locally

Before deploying, test the pipeline locally:

1. Save the generated code to a file
2. Set environment variables for credentials
3. Run with a small data subset
4. Verify data in MotherDuck

```bash
# Test run
python stripe_pipeline.py

# Check results
duckdb "SELECT * FROM raw_stripe.customers LIMIT 10"
```

### Step 6: Deploy to Quarri

Submit the validated pipeline:
```
quarri_schedule_extraction({
    source_name: "stripe",
    pipeline_code: "...",
    schedule: "0 2 * * *",  // Daily at 2 AM
    resources: ["customers", "payments"]
})
```

## Custom API Extraction

For APIs without pre-built connectors:

### Define the API Configuration

```python
config = {
    "client": {
        "base_url": "https://api.example.com",
        "auth": {
            "type": "api_key",
            "api_key": dlt.secrets["api_key"],
            "location": "header",
            "name": "X-API-Key"
        },
        "paginator": {
            "type": "page_number",
            "page_param": "page",
            "total_path": "meta.total_pages"
        }
    },
    "resources": [
        {
            "name": "users",
            "endpoint": {
                "path": "users",
                "params": {
                    "per_page": 100
                }
            },
            "primary_key": "id"
        },
        {
            "name": "orders",
            "endpoint": {
                "path": "orders",
                "params": {
                    "updated_since": "{incremental.updated_at}"
                }
            },
            "primary_key": "order_id",
            "write_disposition": "merge"
        }
    ]
}
```

### Handle Pagination Types

**Offset Pagination**
```python
"paginator": {
    "type": "offset",
    "limit": 100,
    "offset_param": "skip",
    "limit_param": "take"
}
```

**Cursor Pagination**
```python
"paginator": {
    "type": "cursor",
    "cursor_path": "meta.next_cursor",
    "cursor_param": "cursor"
}
```

**Link Header Pagination**
```python
"paginator": {
    "type": "link_header"
}
```

### Handle Authentication Types

**Bearer Token**
```python
"auth": {"type": "bearer", "token": dlt.secrets["token"]}
```

**API Key (Header)**
```python
"auth": {"type": "api_key", "api_key": "...", "location": "header", "name": "X-API-Key"}
```

**API Key (Query)**
```python
"auth": {"type": "api_key", "api_key": "...", "location": "query", "name": "api_key"}
```

**OAuth 2.0**
```python
"auth": {
    "type": "oauth2_client_credentials",
    "client_id": "...",
    "client_secret": "...",
    "token_url": "https://api.example.com/oauth/token"
}
```

## Incremental Loading

Configure incremental extraction to avoid re-processing:

```python
@dlt.resource(write_disposition="merge", primary_key="id")
def orders(
    updated_at = dlt.sources.incremental("updated_at", initial_value="2024-01-01")
):
    """Extract orders incrementally"""
    response = requests.get(
        "https://api.example.com/orders",
        params={"updated_since": updated_at.last_value}
    )
    yield from response.json()["data"]
```

## Error Handling

Handle common extraction errors:

```python
import dlt
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def fetch_with_retry(url, headers):
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()
```

## Output Format

```markdown
## Extraction Pipeline: [Source Name]

### Configuration
- Source: [Name]
- Resources: [List]
- Schedule: [Cron expression]

### Generated Code
```python
[Complete dlt pipeline code]
```

### Testing Instructions
1. [Step to test locally]
2. [Step to verify data]

### Deployment
[How to deploy to Quarri for scheduled runs]
```
