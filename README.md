# mist-orm

> Convention-based data layer for TypeScript. Auto-generate Drizzle ORM schemas from TypeScript interfaces.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Status: Early Development (Phase 0)

**This project is currently in Phase 0 (initial setup).** The package infrastructure is in place, but core functionality has not been implemented yet.

### Current State
- ✅ **Phase 0 Complete:** Project setup, build tooling, testing infrastructure
- 🚧 **Phase 1 Next:** Core schema generation (in planning)
- ⏳ **MVP Target:** Phases 1-3 will deliver usable functionality

**Not yet functional for use.** This README will be updated as features are implemented.

## Vision

Mist will eliminate database schema boilerplate by generating Drizzle ORM schemas from plain TypeScript interfaces using sensible conventions. The goal is to let developers write clean domain models and get a fully-functional, type-safe data layer without manual schema definitions.

### Planned Core Concept

```typescript
// Write this (planned)
export interface User {
  name: string
  email: string
}

// Get this automatically (planned)
// - Database table with id, createdAt, updatedAt
// - Type-safe CRUD operations
// - Migrations
// - Works with Postgres or SQLite
```

## Planned Development Phases

### Phase 0: Project Setup ✅ (Current)
- [x] Package initialization and configuration
- [x] Build tooling (tsup, TypeScript)
- [x] Testing framework (vitest)
- [x] Linting and formatting (ESLint, Prettier)
- [x] Apache 2.0 license

### Phase 1: Core Schema Generation (Next)
- [ ] TypeScript AST parser for interfaces
- [ ] Convention detection (primary keys, timestamps, foreign keys)
- [ ] Type mapping (TypeScript → SQL)
- [ ] Drizzle schema code generation (PostgreSQL & SQLite)
- [ ] File writing system

### Phase 2: Runtime Client
- [ ] Database connection management
- [ ] CRUD operations (insert, findOne, findMany, update, delete)
- [ ] Generated typed client

### Phase 3: CLI & Watch Mode
- [ ] CLI framework with commands
- [ ] `mist generate` command
- [ ] `mist dev` watch mode
- [ ] Configuration file support

### Phases 4-5: Migrations & Advanced Features
See [context-network/planning/roadmap.md](context-network/planning/roadmap.md) for detailed roadmap.

## Planned Features

Once implemented, mist-orm will:

- **Auto-generate schemas** from TypeScript interfaces
- **Apply conventions** for common patterns (IDs, timestamps, foreign keys)
- **Support PostgreSQL and SQLite** with the same code
- **Provide type-safe CRUD** operations
- **Generate migrations** for schema changes
- **Offer escape hatches** for complex cases

## Why mist-orm?

Most CRUD applications follow similar patterns:
- Tables have IDs and timestamps
- `userId` references `users.id`
- TypeScript types map to SQL types

**Stop rewriting the same schema boilerplate.** Mist will apply these conventions automatically while maintaining full type safety through Drizzle ORM.

## Development Setup

If you want to contribute or follow development:

```bash
# Clone the repository
git clone https://github.com/jwynia/mist-orm.git
cd mist-orm

# Install dependencies
npm install

# Run build (currently builds empty stubs)
npm run build

# Run tests (currently none)
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Project Structure

```
mist-orm/
├── src/              # Source code (to be implemented)
├── tests/            # Test files (to be added)
├── examples/         # Example projects (to be added)
├── context-network/  # Planning and design documentation
├── package.json      # Package configuration
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

## Documentation

Detailed planning and architecture documentation is maintained in the [context-network](context-network/) directory:

- [Project Definition](context-network/foundation/project_definition.md)
- [Development Roadmap](context-network/planning/roadmap.md)
- [Task Backlog](context-network/planning/backlog.md)

## Philosophy

When implemented, mist-orm will follow these principles:

- **Interfaces are the source of truth** - Domain models define the database
- **Conventions over configuration** - Sensible defaults eliminate boilerplate
- **Zero-config for common cases** - Works out of the box for typical patterns
- **Escape hatches available** - Drop down to Drizzle for complex scenarios
- **TypeScript-first** - Type safety throughout

## Built On

- [TypeScript](https://www.typescriptlang.org/) - Language and type system
- [Drizzle ORM](https://orm.drizzle.team/) - Underlying ORM layer
- [tsup](https://tsup.egoist.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

## License

Apache-2.0 © 2025 mist-orm contributors

See [LICENSE](LICENSE) file for details.

## Contributing

This project is in early development. Once Phase 1 is underway, contribution guidelines will be established.

For now, you can:
- Watch the repository for updates
- Review planning documents in the context-network
- Open discussions about the planned approach

---

**Note:** This README reflects the current state of the project. It will be updated as each phase is completed to document actual functionality rather than plans.
