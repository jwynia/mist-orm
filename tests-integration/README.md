# Integration Tests

**IMPORTANT:** These are **integration tests** that test mist-orm against real databases. They are **NOT** part of the regular test suite and should **NOT** be run in CI/CD.

## Purpose

These tests verify that mist-orm works correctly with actual PostgreSQL and SQLite databases, testing:

- Full workflow: Interface → Schema generation → Migration → CRUD operations
- Database conventions (foreign keys, timestamps, constraints)
- Migration system (schema diffs, migration generation/application)
- CLI commands with real file systems and databases
- Generated code compilation and execution

## Prerequisites

### PostgreSQL Tests
- Requires PostgreSQL database running
- Uses connection from devcontainer: `postgresql://mist_user:mist-orm-2025!@postgres:5432/mist_dev`
- Database will be reset/cleaned before each test run

### SQLite Tests
- Uses temporary SQLite database files
- No external dependencies required

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run only PostgreSQL integration tests
npm run test:integration -- postgres

# Run only SQLite integration tests
npm run test:integration -- sqlite
```

## Test Structure

```
tests-integration/
├── README.md          # This file
├── setup/             # Test setup utilities and helpers
├── postgres/          # PostgreSQL-specific integration tests
│   ├── crud.test.ts          # CRUD operations
│   ├── migrations.test.ts    # Migration system
│   └── conventions.test.ts   # Convention testing
└── sqlite/            # SQLite-specific integration tests
    ├── crud.test.ts          # CRUD operations
    ├── migrations.test.ts    # Migration system
    └── conventions.test.ts   # Convention testing
```

## Important Notes

1. **Manual Only**: These tests are for manual verification and local development only
2. **Database Required**: PostgreSQL tests require the devcontainer database to be running
3. **Destructive**: Tests will create/drop tables and modify database schemas
4. **Not in CI**: These tests are excluded from CI/CD pipelines intentionally
5. **Cleanup**: Tests clean up after themselves, but failures may leave test data

## Development

When adding new integration tests:

1. Keep tests isolated (each test should be independent)
2. Use unique table/file names to avoid conflicts
3. Clean up resources in `afterEach` / `afterAll` hooks
4. Document any special setup requirements
5. Test both success and failure scenarios
