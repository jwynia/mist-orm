# Mist - Convention-Based Data Layer Specification

> Auto-generate Drizzle ORM schemas from TypeScript interfaces with zero boilerplate

## Project Vision

Mist eliminates database schema boilerplate by generating Drizzle ORM schemas from plain TypeScript interfaces using sensible conventions. Developers write clean domain models and get a fully-functional, type-safe data layer without writing schema definitions.

**Core Philosophy:**
- Interfaces are the source of truth
- Conventions over configuration
- Zero-config for 80% of use cases
- Explicit schemas available for complex 20%
- TypeScript-first developer experience

## Key Features

- ✅ Auto-generate Drizzle schemas from TypeScript interfaces
- ✅ Convention-based foreign keys, timestamps, primary keys
- ✅ Support both PostgreSQL and SQLite with same code
- ✅ Simple CRUD API with type hints
- ✅ Watch mode for development
- ✅ Generated files hidden but reviewable
- ✅ Escape hatches for complex schemas
- ✅ Integrates into existing npm scripts

## Core Conventions

### Primary Keys
- Every table automatically gets an `id` field
- Type detected from usage or defaults to UUID
- Convention: `id: string` → `uuid().defaultRandom().primaryKey()`
- Convention: `id: number` → `serial().primaryKey()`

### Timestamps
- Auto-add `createdAt` and `updatedAt` to every table
- Type: `timestamp().defaultNow().notNull()`
- Can be disabled per table or globally

### Foreign Keys
- Pattern: `{tableName}Id` automatically references `{tableName}.id`
- Examples:
  - `userId: string` → references `users.id`
  - `authorId: string` → references `users.id` (with config mapping)
  - `postId: number` → references `posts.id`

### Many-to-Many Relationships
- Auto-detect and create junction tables
- Pattern: `from_{table1}_to_{table2}`
- Columns: `{table1}Id` and `{table2}Id`
- Example: User-to-Role becomes `from_users_to_roles` with `userId` and `roleId`

### Type Mapping

| TypeScript Type | PostgreSQL | SQLite |
|----------------|------------|--------|
| `string` | `text` | `text` |
| `number` | `integer` | `integer` |
| `boolean` | `boolean` | `integer` (0/1) |
| `Date` | `timestamp` | `integer` (unix timestamp) |
| `string[]` | `text[]` | `text` (JSON) |
| `Record<string, any>` | `jsonb` | `text` (JSON) |

### Nullability
- `field: type` → `.notNull()`
- `field?: type` → nullable

### Uniqueness
- Use JSDoc annotation: `/** @unique */`
- Or naming convention: `{field}Unique`
- Or configuration file

## Project Structure

```
mist/
├── packages/
│   ├── mist/                    # Main package
│   │   ├── src/
│   │   │   ├── cli/            # CLI tool
│   │   │   │   ├── generate.ts # Schema generation
│   │   │   │   ├── dev.ts      # Watch mode
│   │   │   │   └── migrate.ts  # Migration runner
│   │   │   ├── generator/      # Code generation
│   │   │   │   ├── parser.ts   # TS AST parsing
│   │   │   │   ├── analyzer.ts # Convention detection
│   │   │   │   ├── schema.ts   # Drizzle schema generation
│   │   │   │   └── types.ts    # Type generation
│   │   │   ├── runtime/        # Runtime API
│   │   │   │   ├── db.ts       # Main DB client
│   │   │   │   ├── operations.ts # CRUD operations
│   │   │   │   └── connection.ts # Connection management
│   │   │   └── config/         # Configuration
│   │   │       ├── loader.ts   # Config file loading
│   │   │       └── types.ts    # Config types
│   │   ├── bin/
│   │   │   └── mist.js         # CLI entry point
│   │   └── package.json
│   └── create-mist/            # Starter template (optional)
├── examples/
│   ├── basic/                  # Simple CRUD app
│   ├── postgres/               # Postgres example
│   └── sqlite/                 # SQLite example
└── docs/
    ├── getting-started.md
    ├── conventions.md
    ├── configuration.md
    └── api.md
```

## User Workflow

### Installation

```bash
npm install mist
```

### Setup

```typescript
// mist.config.ts
export default {
  models: 'src/models/**/*.ts',
  output: '.mist',
  connection: process.env.DATABASE_URL || './dev.db',
  conventions: {
    timestamps: true,
    primaryKey: 'id',
  }
}
```

### Define Models

```typescript
// src/models/user.ts
export interface User {
  name: string
  /** @unique */
  email: string
  age?: number
}

// src/models/post.ts
export interface Post {
  title: string
  content: string
  userId: string  // Auto-detected FK to users
  published: boolean
}
```

### Use in Code

```typescript
import { db } from 'mist'
import type { User, Post } from './models'

// Insert with type hint
const user = await db.users.insert({ 
  name: 'Alice', 
  email: 'alice@example.com' 
} as User)

// Query with type hint
const found = await db.users.findOne({ 
  email: 'alice@example.com' 
} as User)

// Insert related data
const post = await db.posts.insert({
  title: 'Hello World',
  content: 'My first post',
  userId: user.id,
  published: true
} as Post)

// Query with filters
const posts = await db.posts.findMany({ 
  userId: user.id,
  published: true 
} as Post)

// Update
await db.users.update(
  { id: user.id },
  { name: 'Alicia' } as User
)

// Delete
await db.users.delete({ id: user.id })
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "mist dev",
    "build": "mist generate",
    "db:migrate": "mist migrate"
  }
}
```

## Configuration

### mist.config.ts

```typescript
export interface MistConfig {
  // Input patterns for model files
  models: string | string[]
  
  // Output directory for generated files (should be gitignored)
  output: string
  
  // Database connection string or path
  // Auto-detects postgres vs sqlite from format
  connection: string
  
  // Convention overrides
  conventions?: {
    // Add timestamps to all tables
    timestamps?: boolean
    
    // Primary key field name
    primaryKey?: string
    
    // Custom foreign key mappings
    foreignKeys?: {
      [field: string]: string  // e.g., { authorId: 'users' }
    }
    
    // Fields that should be unique
    unique?: {
      [table: string]: string[]
    }
    
    // Tables to exclude from generation
    exclude?: string[]
  }
  
  // Database-specific options
  database?: {
    type?: 'postgres' | 'sqlite'  // Auto-detected if not specified
    schema?: string  // Postgres schema name
  }
  
  // Development options
  dev?: {
    // Auto-push schema changes in dev mode
    autoMigrate?: boolean
    
    // Watch file patterns
    watch?: string[]
  }
}
```

### Example Configurations

**SQLite Development:**
```typescript
export default {
  models: 'src/models/**/*.ts',
  output: '.mist',
  connection: './dev.db',
}
```

**PostgreSQL Production:**
```typescript
export default {
  models: 'src/models/**/*.ts',
  output: '.mist',
  connection: process.env.DATABASE_URL,
  conventions: {
    foreignKeys: {
      authorId: 'users',
      createdById: 'users',
    },
    unique: {
      users: ['email', 'username'],
    }
  }
}
```

## Generated Output

### Directory Structure

```
.mist/
├── schema/
│   ├── users.ts              # Generated Drizzle schema for users
│   ├── posts.ts              # Generated Drizzle schema for posts
│   └── index.ts              # Exports all schemas
├── types/
│   ├── users.ts              # Generated types (User, NewUser)
│   ├── posts.ts              # Generated types (Post, NewPost)
│   └── index.ts              # Type exports
├── client.ts                 # DB client with typed methods
└── migrations/               # Migration SQL files
    └── 0001_initial.sql
```

### Example Generated Schema

```typescript
// .mist/schema/users.ts
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### Example Generated Types

```typescript
// .mist/types/users.ts
import { users } from '../schema/users'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Example Generated Client

```typescript
// .mist/client.ts
import { drizzle } from 'drizzle-orm/...'
import * as schema from './schema'

export const db = {
  users: {
    insert: async (data: any) => { /* ... */ },
    findOne: async (where: any) => { /* ... */ },
    findMany: async (where?: any) => { /* ... */ },
    update: async (where: any, data: any) => { /* ... */ },
    delete: async (where: any) => { /* ... */ },
  },
  posts: { /* ... */ },
  // ... for each table
}
```

## CLI Commands

### `mist generate`
Generate Drizzle schemas from TypeScript interfaces.

```bash
mist generate [options]

Options:
  --config <path>   Path to config file (default: mist.config.ts)
  --watch          Watch for changes
  --verbose        Verbose output
```

### `mist dev`
Development mode with file watching and auto-migration.

```bash
mist dev [options]

Options:
  --config <path>   Path to config file
  --port <number>   Port for dev server (optional)
```

Behavior:
- Watches model files for changes
- Regenerates schemas automatically
- Auto-pushes schema changes to database (dev only!)
- Shows helpful errors in console

### `mist migrate`
Run migrations.

```bash
mist migrate [options]

Options:
  --config <path>   Path to config file
  --generate       Generate migration from schema changes
  --up             Apply pending migrations
  --down           Rollback last migration
  --reset          Reset database (drop all tables)
```

## Runtime API

### Basic Operations

```typescript
// Insert
const record = await db.{table}.insert(data as Type)

// Find one
const record = await db.{table}.findOne(where as Type)

// Find many
const records = await db.{table}.findMany(where? as Type)

// Update
await db.{table}.update(where, data as Type)

// Delete
await db.{table}.delete(where)
```

### Query Filters

```typescript
// Exact match
await db.users.findMany({ name: 'Alice' } as User)

// Multiple conditions (AND)
await db.posts.findMany({ 
  userId: '123',
  published: true 
} as Post)

// Future: Advanced filters
await db.users.findMany({ 
  age: { gt: 18, lt: 65 }
} as User)
```

### Relationships (Future)

```typescript
// Include related data
const user = await db.users.findOne({ id: '123' }, {
  include: { posts: true }
} as User)

// user.posts is Post[]
```

## Implementation Details

### Phase 1: Core Schema Generation

**Priority: HIGH**

1. **TypeScript AST Parsing**
   - Use `typescript` compiler API
   - Parse interface declarations
   - Extract field names, types, optional flags
   - Handle JSDoc annotations (`@unique`, etc.)

2. **Convention Detection**
   - Detect foreign keys by naming pattern
   - Infer SQL types from TypeScript types
   - Auto-add id, createdAt, updatedAt
   - Apply uniqueness constraints

3. **Drizzle Schema Generation**
   - Generate valid Drizzle table definitions
   - Handle Postgres vs SQLite differences
   - Create proper type imports
   - Generate index files

4. **File Writing**
   - Write to output directory
   - Pretty-print generated code
   - Handle file overwrites safely

### Phase 2: Runtime Client

**Priority: HIGH**

1. **Connection Management**
   - Auto-detect database type from connection string
   - Initialize Drizzle with correct adapter
   - Handle connection pooling
   - Support both Postgres and SQLite

2. **CRUD Operations**
   - Implement insert, findOne, findMany, update, delete
   - Map user operations to Drizzle queries
   - Return properly typed results
   - Handle errors gracefully

3. **Client Generation**
   - Generate typed client methods for each table
   - Export db object with all tables
   - Maintain type safety through generics

### Phase 3: CLI & Watch Mode

**Priority: MEDIUM**

1. **CLI Framework**
   - Use `commander` for CLI
   - Load and validate config
   - Provide helpful error messages

2. **File Watching**
   - Use `chokidar` for file watching
   - Debounce file changes
   - Regenerate on model changes
   - Show progress indicators

3. **Development Mode**
   - Auto-push schema changes (dev only)
   - Show clear warnings about data loss risks
   - Provide migration previews

### Phase 4: Migrations

**Priority: MEDIUM**

1. **Migration Generation**
   - Detect schema changes
   - Generate SQL migration files
   - Use Drizzle Kit internally or custom implementation
   - Support both up and down migrations

2. **Migration Runner**
   - Apply migrations in order
   - Track applied migrations
   - Support rollback
   - Handle migration conflicts

### Phase 5: Advanced Features

**Priority: LOW (Post-MVP)**

1. **Relationship Loading**
   - Include related records
   - Eager loading
   - Lazy loading options

2. **Advanced Queries**
   - Comparison operators (gt, lt, gte, lte)
   - Pattern matching (like, regex)
   - Null checks
   - Ordering and pagination

3. **Validation Integration**
   - Optional Zod schema generation
   - Runtime validation
   - Custom validators

4. **Indexes**
   - JSDoc annotation for indexes: `@index`
   - Composite indexes
   - Unique composite indexes

## Testing Strategy

### Unit Tests
- TS parser correctly extracts interface info
- Convention detection logic
- Schema generation produces valid Drizzle code
- Type mapping is correct

### Integration Tests
- Full generation pipeline works
- Generated code is valid TypeScript
- Generated schemas work with Drizzle
- CRUD operations work correctly

### E2E Tests
- CLI commands work
- Watch mode detects changes
- Migrations apply successfully
- Works with real Postgres and SQLite databases

## Dependencies

### Core Dependencies
- `typescript` - TS compiler API for parsing
- `drizzle-orm` - The underlying ORM
- `drizzle-kit` - Schema introspection and migrations (optional)
- `postgres` or `pg` - PostgreSQL driver
- `better-sqlite3` - SQLite driver

### CLI Dependencies
- `commander` - CLI framework
- `chokidar` - File watching
- `chalk` - Terminal colors
- `ora` - Spinners and progress

### Dev Dependencies
- `vitest` - Testing framework
- `@types/node` - Node types
- `tsup` - Build tool
- `tsx` - TypeScript execution

## Non-Goals (Out of Scope)

- ❌ GUI for database management
- ❌ GraphQL API generation
- ❌ REST API generation
- ❌ Admin panel
- ❌ Authentication/authorization
- ❌ Real-time subscriptions
- ❌ Database seeding tools
- ❌ Multi-tenancy support
- ❌ Sharding/replication management

These are all valuable but should be separate packages or user implementations.

## Success Criteria

**MVP is successful when:**
1. User can define interfaces and get working database
2. CRUD operations work with type safety
3. Works with both Postgres and SQLite
4. Generated code is readable and maintainable
5. Documentation is clear and complete
6. Example projects demonstrate usage

**v1.0 is successful when:**
1. Production-ready stability
2. Migration system is reliable
3. Performance is acceptable (< 1s generation for 50 tables)
4. Error messages are helpful
5. Community is using it in real projects

## Future Considerations

### Potential Enhancements
- Plugin system for custom conventions
- Multiple database support in same project
- Schema versioning and compatibility checks
- Performance optimization (caching, incremental generation)
- IDE extensions for better DX
- Migration squashing
- Seed data management
- Database visualization

### Alternative Approaches to Consider
- Decorator-based instead of interface-based
- Zod schemas as source of truth
- JSON schema format
- Database-first mode (introspect existing DB)

## Getting Started (For Implementation)

1. **Set up monorepo**
   - Use pnpm workspaces or npm workspaces
   - Create `packages/mist` directory
   - Set up TypeScript, linting, testing

2. **Implement TypeScript parser**
   - Create basic parser that reads interfaces
   - Extract field information
   - Write tests for parser

3. **Implement schema generator**
   - Generate simple Drizzle schemas
   - Start with Postgres only
   - Add SQLite support

4. **Create runtime client**
   - Implement basic CRUD operations
   - Connect to real database
   - Test with generated schemas

5. **Build CLI**
   - Add generate command
   - Add watch mode
   - Add helpful error messages

6. **Write documentation**
   - Getting started guide
   - Convention reference
   - API documentation
   - Example projects

7. **Polish and release**
   - Fix bugs from testing
   - Improve error messages
   - Write migration guide from other ORMs
   - Publish to npm

## Example Package.json

```json
{
  "name": "mist",
  "version": "0.1.0",
  "description": "Convention-based Drizzle ORM schema generator",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "mist": "dist/cli.js"
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "keywords": [
    "drizzle",
    "orm",
    "typescript",
    "database",
    "postgres",
    "sqlite",
    "schema",
    "generator"
  ],
  "peerDependencies": {
    "drizzle-orm": "^0.30.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "chokidar": "^3.5.3",
    "chalk": "^5.3.0",
    "ora": "^7.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0",
    "tsx": "^4.0.0"
  }
}
```

## License

Recommend MIT for maximum adoption.

## Conclusion

Mist solves a real pain point: writing database schemas is tedious and repetitive. By applying sensible conventions to TypeScript interfaces, developers can focus on domain modeling while getting a production-ready data layer automatically.

The implementation is achievable using existing tools (TypeScript Compiler API, Drizzle ORM), with clear phases from MVP to v1.0. The project has a focused scope, avoiding feature creep while providing necessary escape hatches for complex use cases.

Success is measured by developer experience: if writing interfaces feels like "just working" while maintaining type safety and performance, Mist achieves its goal.
