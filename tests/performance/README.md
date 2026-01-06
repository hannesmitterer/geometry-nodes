# Performance Testing Configuration

## Using Artillery

Install Artillery:
```bash
npm install --save-dev artillery
```

## Running Performance Tests

```bash
npx artillery run tests/performance/load.yml
```

## Test Configuration

The `load.yml` file defines:
- Target URL
- Load phases (ramp-up, sustained, peak)
- Scenarios to test
- Success criteria

## Customization

Edit `load.yml` to adjust:
- `arrivalRate`: Number of users per second
- `duration`: Length of each phase
- `maxVusers`: Maximum concurrent users
- Endpoints to test

## Metrics

Artillery reports:
- Response times (min, max, median, p95, p99)
- Requests per second
- Error rates
- HTTP status codes

## Example Commands

```bash
# Quick test
npx artillery quick --count 10 --num 5 http://localhost:3000/api/sovereignty/status

# Full test with report
npx artillery run tests/performance/load.yml --output report.json
npx artillery report report.json

# Run specific scenario
npx artillery run tests/performance/load.yml --scenario api-endpoints
```
