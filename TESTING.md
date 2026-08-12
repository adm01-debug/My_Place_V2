# Testing Guide - MY-PLACE

## Unit Tests (Vitest)
```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run test:coverage # Coverage report
```

## E2E Tests (Playwright)
```bash
npm run test:e2e      # Run all
npm run test:e2e:ui   # Interactive UI
npm run test:e2e:debug # Debug mode
```

## Test Files
- `src/test/` - Unit tests
- `e2e/` - E2E tests

## Coverage Target: 80%
