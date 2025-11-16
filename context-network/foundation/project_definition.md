# Project Definition

## Purpose
This document defines the core purpose, goals, and scope of the mist-orm project.

## Classification
- **Domain:** Core Concept
- **Stability:** Static
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### Project Overview

**Project Name:** mist-orm

**NPM Package:** `mist-orm` (CLI command: `mist`)

**Tagline:** Auto-generate Drizzle ORM schemas from TypeScript interfaces with zero boilerplate

**Purpose:** Mist eliminates database schema boilerplate by generating Drizzle ORM schemas from plain TypeScript interfaces using sensible conventions. Developers write clean domain models and get a fully-functional, type-safe data layer without writing schema definitions.

### Vision Statement

Make database development as simple as defining TypeScript interfaces, where conventions eliminate boilerplate and developers focus on domain modeling instead of schema definition.

### Mission Statement

Mist provides a convention-based wrapper around Drizzle ORM that auto-generates schemas from TypeScript interfaces, enabling developers to build type-safe, production-ready data layers with zero configuration for 80% of use cases while maintaining escape hatches for complex scenarios.

### Core Philosophy

- **Interfaces are the source of truth** - Domain models define the database
- **Conventions over configuration** - Sensible defaults eliminate boilerplate
- **Zero-config for 80% of use cases** - Works out of the box for common patterns
- **Explicit schemas available for complex 20%** - Escape hatches when needed
- **TypeScript-first developer experience** - Type safety throughout

### Project Objectives

1. **Eliminate Schema Boilerplate** - Auto-generate Drizzle schemas from TypeScript interfaces
2. **Convention-Based Development** - Automatically detect and implement foreign keys, timestamps, primary keys
3. **Database Agnostic** - Support both PostgreSQL and SQLite with the same code
4. **Type-Safe CRUD API** - Provide simple, type-safe database operations
5. **Developer Experience** - Watch mode, helpful errors, reviewable generated code
6. **Production Ready** - Publish stable npm package to public registry

### Success Criteria

#### MVP Success (v0.1.0)
1. Users can define TypeScript interfaces and get a working database
2. CRUD operations work with full type safety
3. Works with both PostgreSQL and SQLite
4. Generated code is readable and maintainable
5. Documentation is clear and complete
6. Example projects demonstrate usage

#### v1.0 Success
1. Production-ready stability
2. Migration system is reliable
3. Performance is acceptable (< 1s generation for 50 tables)
4. Error messages are helpful
5. Community adoption in real projects
6. Published to npm with Apache 2.0 license

### Project Scope

#### In Scope

- Auto-generate Drizzle ORM schemas from TypeScript interfaces
- Convention-based foreign key detection (`{tableName}Id` → `{tableName}.id`)
- Automatic timestamps (`createdAt`, `updatedAt`)
- Automatic primary keys (`id` field with type detection)
- TypeScript type mapping to SQL types (string → text, number → integer, etc.)
- Support for PostgreSQL and SQLite
- Simple CRUD API (insert, findOne, findMany, update, delete)
- CLI tool with generate, dev (watch mode), and migrate commands
- Configuration file support (`mist.config.ts`)
- Migration generation and runner
- Many-to-many relationship auto-detection and junction tables
- Nullability detection from TypeScript optional fields
- Uniqueness constraints via JSDoc annotations or config
- Watch mode for development with auto-regeneration
- Generated files in `.mist` directory (gitignored but reviewable)

#### Out of Scope

- GUI for database management
- GraphQL API generation
- REST API generation
- Admin panel
- Authentication/authorization systems
- Real-time subscriptions
- Database seeding tools
- Multi-tenancy support
- Sharding/replication management
- Advanced relationship loading (v1.0+)
- Advanced query operators (v1.0+)
- Validation integration (v1.0+)

### Stakeholders

| Role | Responsibilities | Representative(s) |
|------|-----------------|-------------------|
| Package Author | Design, implementation, documentation | TBD |
| TypeScript Developers | Primary users, feedback | Open source community |
| Drizzle ORM Team | Upstream dependency maintainers | Drizzle ORM |
| npm Registry | Package distribution | npm |

### Timeline

See `planning/roadmap.md` for detailed timeline. High-level phases:

| Phase | Target | Description |
|-------|--------|-------------|
| Phase 1: Core Schema Generation | MVP | TypeScript parsing, schema generation, file writing |
| Phase 2: Runtime Client | MVP | Connection management, CRUD operations |
| Phase 3: CLI & Watch Mode | MVP | CLI framework, file watching, dev mode |
| Phase 4: Migrations | v1.0 | Migration generation and runner |
| Phase 5: Advanced Features | Post-v1.0 | Relationships, advanced queries, validation |

### License

**Apache 2.0** - To match Drizzle ORM licensing and ensure compatibility

### Technical Stack

#### Core Dependencies
- `typescript` - TS compiler API for parsing interfaces
- `drizzle-orm` - The underlying ORM (peer dependency)
- `drizzle-kit` - Schema introspection and migrations (optional)
- `postgres` or `pg` - PostgreSQL driver
- `better-sqlite3` - SQLite driver

#### CLI Dependencies
- `commander` - CLI framework
- `chokidar` - File watching
- `chalk` - Terminal colors
- `ora` - Spinners and progress

#### Development Dependencies
- `vitest` - Testing framework
- `tsup` - Build tool
- `tsx` - TypeScript execution

### Constraints

- Must maintain compatibility with Drizzle ORM public API
- Generated code must be valid TypeScript and Drizzle schemas
- TypeScript compiler API is the only source of interface information
- Convention detection limited to what can be inferred from interface structure and naming
- Performance must support at least 50 tables with < 1s generation time

### Assumptions

- Developers are using TypeScript (not plain JavaScript)
- Drizzle ORM API remains stable
- Users follow reasonable naming conventions for models
- Database connection strings follow standard formats
- Generated `.mist` directory can be gitignored safely
- Watch mode is only used in development environments

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Drizzle ORM breaking changes | High | Pin to stable versions, monitor releases, maintain compatibility layer |
| TypeScript compiler API changes | Medium | Use stable APIs, test against multiple TS versions |
| Convention ambiguity | Medium | Provide clear configuration overrides, document edge cases |
| Performance issues with large schemas | Medium | Implement caching, incremental generation |
| Community adoption | High | Excellent documentation, clear examples, responsive support |

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** 
  - [foundation/structure.md] - implements - Structural implementation of project goals
  - [foundation/principles.md] - guides - Principles that guide project execution
- **Related Nodes:** 
  - [planning/roadmap.md] - details - Specific implementation plan for project goals
  - [planning/milestones.md] - schedules - Timeline for achieving project objectives

## Navigation Guidance
- **Access Context:** Use this document when needing to understand the fundamental purpose and scope of the project
- **Common Next Steps:** After reviewing this definition, typically explore structure.md or principles.md
- **Related Tasks:** Strategic planning, scope definition, stakeholder communication
- **Update Patterns:** This document should be updated when there are fundamental changes to project direction or scope

## Metadata
- **Created:** 2025-11-16
- **Last Updated:** 2025-11-16
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-11-16: Populated project definition with mist-orm specifications
