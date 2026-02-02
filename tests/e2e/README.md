# E2E Testing Guide

## Prerequisites

Install Playwright:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Running E2E Tests

```bash
npx playwright test tests/e2e/user-flows.spec.js
```

## Test Files

This directory will contain end-to-end tests using Playwright.

### Example Test Structure

```javascript
import { test, expect } from '@playwright/test';

test('complete monitoring workflow', async ({ page }) => {
  // Navigate to application
  await page.goto('http://localhost:8080');
  
  // Check initial load
  await expect(page.locator('#mhc-display')).toContainText('RS-CORONATION');
  
  // Verify elements are visible
  await expect(page.locator('#connection-status')).toBeVisible();
  
  // Check for log entries
  const logs = page.locator('#log-container .log-entry');
  await expect(logs.first()).toBeVisible();
});
```

## Future Tests

1. **user-flows.spec.js** - Complete user workflows
2. **analytics.spec.js** - Analytics dashboard tests
3. **websocket.spec.js** - Real-time updates tests
4. **offline.spec.js** - Offline mode tests

## Notes

- Ensure both backend (port 3000/3001) and frontend (port 8080) servers are running
- Tests will automatically start browsers and run scenarios
- Use --headed flag to see browser: `npx playwright test --headed`
