# mist-orm

> Convention-based data layer for TypeScript. Auto-generate Drizzle ORM schemas from TypeScript interfaces.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Status: MVP Complete! 🎉

**mist-orm has reached MVP status (v0.1.0)** with all core functionality implemented and tested.

### Current State
- ✅ **Phase 1 Complete:** Core schema generation (TypeScript → Drizzle schemas)
- ✅ **Phase 2 Complete:** Runtime client with type-safe CRUD operations
- ✅ **Phase 3 Complete:** CLI with generate and dev (watch) modes
- 🚧 **Phase 4 Next:** Migration system (planned for v1.0)

**123 tests passing** • **PostgreSQL and SQLite support** • **Production-ready for simple use cases**

## Quick Start

### Installation

```bash
npm install mist-orm drizzle-orm
# For PostgreSQL
npm install postgres
# For SQLite
npm install better-sqlite3
```

### 1. Define Your Models

Create TypeScript interfaces for your domain models:

```typescript
// models/user.ts
export interface User {
  name: string
  email: string
  age?: number
}

// models/post.ts
export interface Post {
  title: string
  content: string
  userId: string  // Automatically creates foreign key to users.id
}
```

### 2. Create Configuration

Create `mist.config.ts` in your project root:

```typescript
export default {
  models: './models/**/*.ts',
  output: './.mist',
  connection: 'postgresql://localhost/mydb',  // or './data.db' for SQLite
}
```

### 3. Generate Schemas

```bash
# One-time generation
npx mist generate

# Or watch mode for development
npx mist dev
```

This generates Drizzle ORM schemas in `.mist/schema/` and type definitions in `.mist/types/`.

### 4. Use the Generated Client

```typescript
import { db } from './.mist/client'

// Insert
const user = await db.users.insert({
  name: 'Alice',
  email: 'alice@example.com',
  age: 30
})

// Query
const users = await db.users.findMany({ age: 30 })
const alice = await db.users.findOne({ email: 'alice@example.com' })

// Update
await db.users.update(
  { email: 'alice@example.com' },
  { age: 31 }
)

// Delete
await db.users.delete({ email: 'alice@example.com' })
```

## Features

### ✅ Implemented (MVP)

- **Auto-generate Drizzle schemas** from TypeScript interfaces
- **Convention-based patterns**:
  - Auto-generated `id` (UUID for Postgres, integer for SQLite)
  - Auto-generated `createdAt` and `updatedAt` timestamps
  - Foreign key detection (`userId` → `users.id`)
  - Unique constraints via JSDoc (`/** @unique */`)
- **PostgreSQL and SQLite support** with the same code
- **Type-safe CRUD operations**: insert, findOne, findMany, update, delete
- **CLI commands**: `generate`, `dev` (watch mode)
- **Configuration file** support (mist.config.ts)
- **File watching** with auto-regeneration and debouncing

### 🚧 Planned (Future Releases)

- **Migrations** - Automatic migration generation (Phase 4, v1.0)
- **Advanced queries** - Comparison operators, ordering, pagination (Phase 5)
- **Relationship loading** - Include related records (Phase 5)
- **Validation** - Zod schema generation (Phase 5)

## CLI Reference

### `mist generate`

Generate Drizzle schemas from your TypeScript interfaces.

```bash
mist generate [options]

Options:
  -c, --config <path>  Path to config file (default: "./mist.config.ts")
  -v, --verbose        Verbose output
```

**Example:**
```bash
npx mist generate
npx mist generate --config ./custom.config.ts --verbose
```

### `mist dev`

Watch mode with automatic regeneration on file changes.

```bash
mist dev [options]

Options:
  -c, --config <path>  Path to config file (default: "./mist.config.ts")
  -v, --verbose        Verbose output
  --no-clear           Don't clear console on regeneration
```

**Example:**
```bash
npx mist dev
```

## Configuration

Create `mist.config.ts` in your project root:

```typescript
import type { MistConfig } from 'mist-orm'

const config: MistConfig = {
  // Required: Glob pattern(s) for model files
  models: './models/**/*.ts',

  // Required: Output directory for generated files
  output: './.mist',

  // Required: Database connection string
  // PostgreSQL: 'postgresql://user:pass@host/db'
  // SQLite: './path/to/database.db'
  connection: process.env.DATABASE_URL || 'postgresql://localhost/mydb',

  // Optional: Convention overrides
  conventions: {
    timestamps: true,           // Auto-add createdAt/updatedAt (default: true)
    primaryKey: 'id',           // Primary key field name (default: 'id')
    foreignKeys: {              // Custom foreign key mappings
      authorId: 'users',        // Map authorId → users.id
    },
    unique: {                   // Unique constraints per table
      User: ['email'],
      Post: ['slug'],
    },
    exclude: ['internal'],      // Fields to exclude from schema
  },

  // Optional: Database-specific settings
  database: {
    type: 'postgres',           // 'postgres' or 'sqlite' (auto-detected)
    schema: 'public',           // PostgreSQL schema name (default: 'public')
  },

  // Optional: Development mode settings
  dev: {
    autoMigrate: false,         // Auto-push schema changes (default: false)
    watch: ['./lib/**/*.ts'],   // Additional paths to watch
  },
}

export default config
```

## Conventions

### Primary Keys

Every table automatically gets an `id` primary key:
- **PostgreSQL**: `uuid` with `defaultRandom()`
- **SQLite**: `integer` with auto-increment

### Timestamps

Tables automatically include:
- `createdAt: timestamp` - Set on record creation
- `updatedAt: timestamp` - Updated on every modification

Disable with `conventions.timestamps = false`.

### Foreign Keys

Fields ending in `Id` automatically create foreign key relationships:

```typescript
interface Post {
  userId: string    // Creates: references(() => users.id)
  authorId: string  // Creates: references(() => authors.id)
}
```

Override with `conventions.foreignKeys`:

```typescript
conventions: {
  foreignKeys: {
    authorId: 'users'  // Maps authorId → users.id instead of authors.id
  }
}
```

### Unique Constraints

Add unique constraints via JSDoc or configuration:

```typescript
interface User {
  /** @unique */
  email: string
}
```

Or in config:

```typescript
conventions: {
  unique: {
    User: ['email', 'username']
  }
}
```

## Type Mapping

| TypeScript Type | PostgreSQL | SQLite |
|----------------|------------|--------|
| `string` | `text` | `text` |
| `number` | `integer` | `integer` |
| `boolean` | `boolean` | `integer` (0/1) |
| `Date` | `timestamp` | `integer` (unix) |
| `string[]` | `text[]` (array) | `text` (JSON) |
| `object` | `jsonb` | `text` (JSON) |

## Project Structure

```
your-project/
├── models/              # Your TypeScript interfaces
│   ├── user.ts
│   └── post.ts
├── .mist/               # Generated files (auto-generated)
│   ├── schema/          # Drizzle table definitions
│   │   ├── index.ts
│   │   ├── users.ts
│   │   └── posts.ts
│   ├── types/           # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── users.ts
│   │   └── posts.ts
│   └── client.ts        # Generated database client
├── mist.config.ts       # Configuration file
└── package.json
```

**Important:** Add `.mist/` to your `.gitignore`. These files are auto-generated.

## Development Phases

### Phase 0: Project Setup ✅
- [x] Package initialization and configuration
- [x] Build tooling (tsup, TypeScript)
- [x] Testing framework (vitest)
- [x] Linting and formatting (ESLint, Prettier)

### Phase 1: Core Schema Generation ✅
- [x] TypeScript AST parser for interfaces
- [x] Convention detection (primary keys, timestamps, foreign keys)
- [x] Type mapping (TypeScript → SQL)
- [x] Drizzle schema code generation (PostgreSQL & SQLite)
- [x] File writing system

### Phase 2: Runtime Client ✅
- [x] Database connection management
- [x] CRUD operations (insert, findOne, findMany, update, delete)
- [x] Generated typed client

### Phase 3: CLI & Watch Mode ✅
- [x] CLI framework with commands
- [x] `mist generate` command
- [x] `mist dev` watch mode
- [x] Configuration file support

### Phase 4: Migrations (v1.0) 🚧
- [ ] Schema diff detection
- [ ] Migration file generation
- [ ] Migration runner with tracking
- [ ] Rollback support

### Phase 5: Advanced Features 🚧
See [context-network/planning/roadmap.md](context-network/planning/roadmap.md) for detailed roadmap.

## Why mist-orm?

Most CRUD applications follow similar patterns:
- Tables have IDs and timestamps
- `userId` references `users.id`
- TypeScript types map to SQL types

**Stop rewriting the same schema boilerplate.** Mist applies these conventions automatically while maintaining full type safety through Drizzle ORM.

### Compared to Other ORMs

**vs. Prisma:**
- Lighter weight, uses Drizzle under the hood
- No schema file to maintain
- Convention-based vs. explicit schema

**vs. Drizzle ORM alone:**
- Eliminates manual schema definition
- Auto-generates type-safe client
- Convention-based patterns

**vs. TypeORM:**
- Simpler, convention-based approach
- Better TypeScript integration
- Smaller bundle size

## Development Setup

```bash
# Clone the repository
git clone https://github.com/jwynia/mist-orm.git
cd mist-orm

# Install dependencies
npm install

# Run build
npm run build

# Run tests (123 tests)
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Documentation

Detailed planning and architecture documentation:

- [Project Definition](context-network/foundation/project_definition.md)
- [Development Roadmap](context-network/planning/roadmap.md)
- [Task Backlog](context-network/planning/backlog.md)

## Philosophy

- **Interfaces are the source of truth** - Domain models define the database
- **Conventions over configuration** - Sensible defaults eliminate boilerplate
- **Zero-config for common cases** - Works out of the box for typical patterns
- **Escape hatches available** - Drop down to Drizzle for complex scenarios
- **TypeScript-first** - Type safety throughout

## Built On

- [TypeScript](https://www.typescriptlang.org/) - Language and type system
- [Drizzle ORM](https://orm.drizzle.team/) - Underlying ORM layer
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chokidar](https://github.com/paulmillr/chokidar) - File watching
- [tsup](https://tsup.egoist.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

## Examples

See the [examples](examples/) directory for:
- Basic usage example
- PostgreSQL setup
- SQLite setup

## Limitations (Current MVP)

- **No migrations yet** - Use Drizzle Kit for now (Phase 4 will add this)
- **Basic query operations** - Advanced filtering coming in Phase 5
- **No relationship loading** - Manual joins required (Phase 5)
- **Simple validation only** - Zod integration planned for Phase 5

## License

Apache-2.0 © 2025 mist-orm contributors

See [LICENSE](LICENSE) file for details.

## Contributing

We welcome contributions! The project is in active development.

To contribute:
1. Check the [issues](https://github.com/jwynia/mist-orm/issues) or [roadmap](context-network/planning/roadmap.md)
2. Fork the repository
3. Create a feature branch
4. Write tests for your changes
5. Ensure all tests pass (`npm test`)
6. Submit a pull request

For major changes, please open an issue first to discuss your proposal.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history (coming soon).

---

**Note:** This README reflects the current MVP state of the project. Features marked as complete are fully functional and tested.
