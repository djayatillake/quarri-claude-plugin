#!/bin/bash
# Test script for Quarri MCP Server
# Run after authenticating with: node dist/auth-cli.js auth

set -e

echo "=== Quarri MCP Server Test ==="
echo ""

# Helper to send MCP request
send_mcp() {
  local method=$1
  local params=$2
  local id=$3

  echo "{\"jsonrpc\":\"2.0\",\"method\":\"$method\",\"params\":$params,\"id\":$id}"
}

# Run tests
run_tests() {
  cat <<'INIT'
{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}
INIT

  echo ""

  # Test 1: Auth Status
  cat <<'TEST1'
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"quarri_auth_status","arguments":{}},"id":2}
TEST1

  echo ""

  # Test 2: List Databases
  cat <<'TEST2'
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"quarri_list_databases","arguments":{}},"id":3}
TEST2

  echo ""

  # Test 3: Get Schema (if authenticated)
  cat <<'TEST3'
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"quarri_get_schema","arguments":{}},"id":4}
TEST3

  echo ""

  # Test 4: Simple query
  cat <<'TEST4'
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"quarri_query_agent","arguments":{"question":"How many tables are in the database?"}},"id":5}
TEST4
}

# Execute tests
echo "Running MCP tests..."
echo "=================="
run_tests | node dist/index.js 2>&1 | while IFS= read -r line; do
  if [[ $line == *"jsonrpc"* ]]; then
    echo "$line" | python3 -m json.tool 2>/dev/null || echo "$line"
  else
    echo "$line"
  fi
done

echo ""
echo "=================="
echo "Tests complete."
