# Frontend Test Suite

This directory contains comprehensive unit and integration tests for the frontend application.

## Test Structure

### Pages Tests (`pages/`)
Unit tests for all pages:
- `index.test.jsx` - Dashboard/Home page
- `overview.test.jsx` - Overview page
- `search.test.jsx` - Search page
- `myEvents.test.jsx` - My Events (organizer) page
- `mySubscriptions.test.jsx` - My Subscriptions (subscriber) page
- `settings-profile.test.jsx` - Settings profile page

### Component Tests (`components/`)
Unit tests for reusable components:
- `eventCard.test.jsx` - Event card component
- `EventFilters.test.jsx` - Event filters component
- `poapCard.test.jsx` - POAP card component
- `poapEvents.test.jsx` - POAP events component

### Service Tests (`services/`)
Unit tests for service layer:
- `poap.service.test.ts` - POAP service API calls
- `event.service.test.ts` - Event service API calls
- `dataSync.service.test.js` - Data synchronization service

### Helper Tests (`helpers/`)
Unit tests for custom hooks and utilities:
- `useValidateEventDate.test.jsx` - Date validation hook
- `useOnClickOutside.test.jsx` - Click outside detection hook

### Integration Tests (`integration/`)
End-to-end flow tests:
- `my-events-flow.test.jsx` - Complete My Events page flow
- `my-subscriptions-flow.test.jsx` - Complete My Subscriptions page flow

## Test Utilities

### `utils/testUtils.jsx`
Provides reusable test utilities:
- `mockDrawerContext` - Mock drawer context state
- `mockDrawerDispatch` - Mock dispatch function
- `renderWithProviders` - Custom render function with router and context providers
- `MockDrawerProvider` - Mock drawer provider component

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run a specific test file
```bash
npm test -- myEvents.test.jsx
```

## Test Coverage

The test suite covers:
- ✅ All pages (6 pages)
- ✅ Key components (4+ components)
- ✅ Service layer (3 services)
- ✅ Custom hooks (2 hooks)
- ✅ Integration flows (2 flows)

## Mocking Strategy

- **Services**: All API calls are mocked using `jest.mock()`
- **Context**: Drawer context is mocked with test utilities
- **Router**: React Router is wrapped in test utilities
- **Layout**: Layout component is mocked globally

## Writing New Tests

When adding new tests:

1. **Pages**: Add to `pages/` directory following naming convention `[pageName].test.jsx`
2. **Components**: Add to `components/` directory
3. **Services**: Add to `services/` directory
4. **Helpers**: Add to `helpers/` directory
5. **Integration**: Add to `integration/` directory

Use `renderWithProviders` from test utilities for components that need context or routing.

## Notes

- All tests use React Testing Library best practices
- Tests are isolated and don't depend on external services
- Mock data is provided inline in test files

