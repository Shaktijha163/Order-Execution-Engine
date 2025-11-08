# Test Suite Documentation

## Overview
Comprehensive test suite covering unit tests, integration tests, and API testing for the Order Execution Engine.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── dexRouter.test.ts    # DEX routing logic
│   ├── helpers.test.ts      # Utility functions
│   └── orderValidation.test.ts  # Order validation
├── integration/             # Integration tests
│   ├── api.test.ts          # API endpoint testing
│   └── orderWorkflow.test.ts    # Full order lifecycle
└── setup.ts                 # Test environment setup
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Unit Tests Only
```bash
npm run test:unit
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

### Unit Tests (6 test suites)
1. **DexRouter Tests** - Tests routing logic and DEX selection
   - Quote generation for Raydium and Meteora
   - Best quote selection
   - Swap execution with slippage protection
   - Network error handling

2. **Helpers Tests** - Tests utility functions
   - UUID generation
   - Transaction hash generation
   - Amount calculation
   - Sleep function

3. **Order Validation Tests** - Tests Zod schema validation
   - Valid order requests
   - Default values
   - Invalid inputs (negative amounts, missing fields, etc.)

### Integration Tests (4 test suites)
1. **API Tests** - Tests all HTTP endpoints
   - POST `/api/orders/execute` - Order creation
   - GET `/api/orders/:orderId` - Order retrieval
   - GET `/api/orders/metrics` - Queue metrics
   - WebSocket connections

2. **Order Workflow Tests** - Tests complete order lifecycle
   - Full order processing (pending → confirmed/failed)
   - Concurrent order handling
   - Retry logic with exponential backoff
   - Queue metrics tracking

## Prerequisites

Before running tests, ensure:
1. PostgreSQL is running (via Docker)
2. Redis is running (via Docker)
3. Environment variables are set

```bash
# Start dependencies
docker-compose up -d postgres redis
```

## Postman Collection

A Postman collection is provided at `Order-Execution-Engine.postman_collection.json` with:
- Health check
- API documentation
- Order execution (various scenarios)
- Order retrieval
- Queue metrics
- Bulk order testing

### Import to Postman
1. Open Postman
2. Click Import
3. Select the JSON file
4. Run requests individually or use the Collection Runner

## WebSocket Testing

For WebSocket testing, use tools like:
- **wscat**: `npm install -g wscat`
  ```bash
  wscat -c ws://localhost:3000/api/orders/ws/YOUR_ORDER_ID
  ```
- **Postman** (supports WebSocket)
- **Browser DevTools**

## Test Scenarios Covered

### Success Cases
✅ Valid order execution  
✅ DEX routing (Raydium vs Meteora)  
✅ Concurrent order processing (up to 10)  
✅ WebSocket status updates  
✅ Default slippage application  

### Error Cases
❌ Invalid order data  
❌ Negative amounts  
❌ Missing required fields  
❌ Slippage exceeded  
❌ Network errors (10% simulated failure rate)  
❌ Non-existent order retrieval  

### Edge Cases
🔸 Zero fee calculations  
🔸 High slippage values  
🔸 Multiple concurrent WebSocket connections  
🔸 Retry logic (up to 3 attempts)  

## Expected Test Results

- **Unit Tests**: ~20 tests should pass
- **Integration Tests**: ~10 tests should pass
- **Total Coverage**: Aim for >80%

## Troubleshooting

### Tests Failing to Connect to Database
```bash
# Check if containers are running
docker-compose ps

# Restart containers
docker-compose restart postgres redis
```

### Tests Timing Out
- Increase timeout in `jest.config.js`
- Check if services are responding

### Redis Connection Issues
```bash
# Check Redis
docker-compose logs redis

# Clear Redis data
docker-compose exec redis redis-cli FLUSHALL
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
```

## Next Steps

1. Add E2E tests with real WebSocket clients
2. Add performance tests for 100 orders/minute
3. Add chaos engineering tests (network failures, service crashes)
4. Add load testing with k6 or Artillery