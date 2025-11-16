# Project Backlog

## Purpose
This document contains the detailed implementation tasks for building mist-orm. Tasks are organized by phase and broken down into actionable work items.

## Classification
- **Domain:** Planning
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** Evolving

## Content

### Backlog Overview

This backlog breaks down the high-level roadmap (see `roadmap.md`) into concrete, actionable tasks. Tasks are organized by phase and include technical details, dependencies, and acceptance criteria.

**Status Legend:**
- **Not Started** - Task identified but not begun
- **In Progress** - Currently being worked on
- **Blocked** - Waiting on dependencies or decisions
- **Completed** - Done and verified
- **Deferred** - Postponed to future phase

---

## Phase 0: Project Setup

### 0.1 Repository and Package Initialization
**Status:** Not Started
**Priority:** High
**Effort:** 2-4 hours

**Tasks:**
- [ ] Initialize git repository
- [ ] Create package.json with correct metadata
  - Name: "mist" (or "mist-orm" if available)
  - Version: 0.0.1
  - License: Apache-2.0
  - Repository URL
  - Keywords for discoverability
- [ ] Set up TypeScript configuration (tsconfig.json)
  - Strict mode enabled
  - Target: ES2020 or later
  - Module: ESNext
  - Declaration files enabled
- [ ] Create directory structure
  - `src/` for source code
  - `dist/` for compiled output
  - `tests/` for test files
  - `examples/` for example projects
  - `.mist/` for generated files (gitignored)
- [ ] Set up .gitignore
  - node_modules
  - dist
  - .mist
  - *.log
  - coverage
- [ ] Create initial README.md with project vision

**Acceptance Criteria:**
- Package can be built with `npm run build`
- TypeScript compiles without errors
- Git repository is initialized and has initial commit

### 0.2 Development Tooling
**Status:** Not Started
**Priority:** High
**Effort:** 2-3 hours

**Tasks:**
- [ ] Install and configure build tool (tsup recommended)
  - Entry points: src/index.ts, src/cli.ts
  - Output formats: ESM and CJS
  - Declaration files generated
- [ ] Set up testing framework (vitest)
  - Basic test configuration
  - Test script in package.json
  - Coverage reporting
- [ ] Install and configure linting (ESLint + Prettier)
  - TypeScript ESLint parser
  - Recommended rules
  - Format on save configuration
- [ ] Set up npm scripts
  - `build`: Compile TypeScript
  - `test`: Run tests
  - `dev`: Watch mode for development
  - `lint`: Run linter
  - `format`: Format code
- [ ] Create LICENSE file (Apache 2.0)

**Acceptance Criteria:**
- `npm test` runs successfully (even with no tests)
- `npm run build` produces dist/ output
- Linting and formatting work correctly

### 0.3 Core Dependencies Installation
**Status:** Not Started
**Priority:** High
**Effort:** 1 hour

**Tasks:**
- [ ] Install core dependencies
  - `typescript` (dev)
  - `drizzle-orm` (peer dependency)
  - Add to package.json with correct versions
- [ ] Install CLI dependencies
  - `commander` - CLI framework
  - `chokidar` - File watching
  - `chalk` - Terminal colors
  - `ora` - Progress spinners
- [ ] Install database drivers (as optional peer dependencies)
  - `postgres` or `pg` - PostgreSQL
  - `better-sqlite3` - SQLite
- [ ] Install dev dependencies
  - `@types/node`
  - `tsup` - Build tool
  - `tsx` - TypeScript execution
  - `vitest` - Testing
  - `eslint`, `prettier`, etc.

**Acceptance Criteria:**
- All dependencies install without errors
- package.json has correct dependency declarations
- No security vulnerabilities reported

---

## Phase 1: Core Schema Generation

### 1.1 TypeScript AST Parser - Basic Interface Extraction
**Status:** Not Started
**Priority:** Critical
**Effort:** 8-12 hours
**Dependencies:** 0.1, 0.2, 0.3

**Tasks:**
- [ ] Create `src/generator/parser.ts`
- [ ] Implement function to read TypeScript file and create source file AST
  - Use `ts.createProgram()` or `ts.createSourceFile()`
  - Handle file reading errors gracefully
- [ ] Implement interface visitor pattern
  - Walk AST and find all interface declarations
  - Extract interface name
  - Extract extends clauses (if any)
- [ ] Extract interface properties
  - Property name
  - Property type (as TypeNode)
  - Optional flag (?)
  - JSDoc comments
- [ ] Create data structure to represent parsed interfaces
  ```typescript
  interface ParsedInterface {
    name: string
    properties: ParsedProperty[]
    location: { file: string; line: number }
  }

  interface ParsedProperty {
    name: string
    type: string // Simplified type representation
    optional: boolean
    jsDocTags: Record<string, string>
  }
  ```
- [ ] Write unit tests for parser
  - Parse simple interface with string, number, boolean
  - Parse interface with optional fields
  - Parse interface with JSDoc annotations
  - Handle syntax errors gracefully

**Acceptance Criteria:**
- Can parse a TypeScript file containing interfaces
- Extracts all interface names and properties
- Handles optional fields correctly
- Extracts JSDoc annotations
- Returns structured data that's easy to work with

### 1.2 Type Mapper - TypeScript to SQL Types
**Status:** Not Started
**Priority:** Critical
**Effort:** 6-8 hours
**Dependencies:** 1.1

**Tasks:**
- [ ] Create `src/generator/types.ts`
- [ ] Implement type mapping function
  - Input: TypeScript type string, target database
  - Output: Drizzle column definition
- [ ] Map primitive types
  - `string` → PostgreSQL: `text()`, SQLite: `text()`
  - `number` → PostgreSQL: `integer()`, SQLite: `integer()`
  - `boolean` → PostgreSQL: `boolean()`, SQLite: `integer()`
  - `Date` → PostgreSQL: `timestamp()`, SQLite: `integer()`
- [ ] Map complex types
  - `string[]` → PostgreSQL: `text().array()`, SQLite: `text()` (JSON)
  - `Record<string, any>` → PostgreSQL: `jsonb()`, SQLite: `text()` (JSON)
  - Union types with null/undefined (handle as nullable)
- [ ] Add type modifiers
  - `.notNull()` for required fields
  - Nullable for optional fields
- [ ] Handle unknown/unsupported types
  - Default to `text()`
  - Log warning for unsupported types
- [ ] Write unit tests for type mapping
  - All primitive types
  - Array types
  - Object types
  - Both PostgreSQL and SQLite outputs

**Acceptance Criteria:**
- All common TypeScript types map correctly
- PostgreSQL and SQLite mappings are correct
- Nullability is handled properly
- Unsupported types have sensible defaults

### 1.3 Convention Detector - Auto-detect Patterns
**Status:** Not Started
**Priority:** High
**Effort:** 8-10 hours
**Dependencies:** 1.1, 1.2

**Tasks:**
- [ ] Create `src/generator/analyzer.ts`
- [ ] Implement primary key detection
  - Look for `id` field
  - Detect type: `string` → UUID, `number` → serial
  - Create appropriate primary key definition
- [ ] Implement timestamp detection
  - Auto-add `createdAt: timestamp().defaultNow().notNull()`
  - Auto-add `updatedAt: timestamp().defaultNow().notNull()`
  - Support disabling via config
- [ ] Implement foreign key detection
  - Pattern: `{tableName}Id` → references `{tableName}.id`
  - Examples: `userId` → `users.id`, `postId` → `posts.id`
  - Handle custom mappings from config (e.g., `authorId` → `users`)
  - Store foreign key relationships for later schema generation
- [ ] Implement uniqueness detection
  - JSDoc tag: `/** @unique */`
  - Naming convention: `emailUnique`
  - Config file specification
- [ ] Implement many-to-many detection
  - Look for junction table patterns
  - Detect `from_{table1}_to_{table2}` naming
  - Auto-create junction table schemas
- [ ] Write unit tests for convention detection
  - Primary key detection
  - Foreign key detection with various patterns
  - Uniqueness detection
  - Timestamp auto-addition

**Acceptance Criteria:**
- Primary keys detected and typed correctly
- Foreign keys detected from naming patterns
- Timestamps added automatically (when configured)
- Uniqueness constraints detected
- Config can override conventions

### 1.4 Drizzle Schema Generator - PostgreSQL
**Status:** Not Started
**Priority:** Critical
**Effort:** 10-12 hours
**Dependencies:** 1.1, 1.2, 1.3

**Tasks:**
- [ ] Create `src/generator/schema.ts`
- [ ] Implement Drizzle schema code generation for PostgreSQL
  - Generate import statements
    ```typescript
    import { pgTable, text, integer, uuid, timestamp, ... } from 'drizzle-orm/pg-core'
    ```
  - Generate table definition
    ```typescript
    export const users = pgTable('users', {
      id: uuid('id').defaultRandom().primaryKey(),
      name: text('name').notNull(),
      email: text('email').notNull().unique(),
      // ...
    })
    ```
- [ ] Generate fields with correct types and modifiers
  - Primary key fields
  - Regular fields with nullability
  - Foreign key references
  - Unique constraints
  - Default values
- [ ] Generate foreign key relations
  - Use `.references()` for foreign keys
  - Proper syntax: `userId: uuid('user_id').references(() => users.id)`
- [ ] Generate index definitions (if configured)
- [ ] Pretty-print generated code
  - Proper indentation
  - Consistent formatting
  - Readable output
- [ ] Write unit tests
  - Generate schema for simple interface
  - Generate schema with foreign keys
  - Generate schema with all field types
  - Verify generated code is valid TypeScript

**Acceptance Criteria:**
- Generates valid Drizzle ORM schema code
- Code compiles without TypeScript errors
- All field types mapped correctly
- Foreign keys properly defined
- Output is readable and well-formatted

### 1.5 Drizzle Schema Generator - SQLite
**Status:** Not Started
**Priority:** High
**Effort:** 6-8 hours
**Dependencies:** 1.4

**Tasks:**
- [ ] Extend schema generator for SQLite
  - Generate SQLite-specific imports
    ```typescript
    import { sqliteTable, text, integer, ... } from 'drizzle-orm/sqlite-core'
    ```
  - Use `sqliteTable()` instead of `pgTable()`
- [ ] Adjust type mappings for SQLite
  - Boolean → integer (0/1)
  - Date → integer (unix timestamp)
  - Arrays → text with JSON encoding
  - Objects → text with JSON encoding
- [ ] Handle primary keys
  - `id: integer('id').primaryKey()` for auto-increment
  - `id: text('id').primaryKey()` for UUIDs (with client-side generation)
- [ ] Generate foreign key constraints
  - SQLite syntax differences
- [ ] Write unit tests for SQLite generation
  - Same test cases as PostgreSQL
  - Verify SQLite-specific types are correct

**Acceptance Criteria:**
- Generates valid SQLite Drizzle schemas
- Type mappings are SQLite-appropriate
- Generated code compiles and works with SQLite

### 1.6 File Writer - Output Generated Schemas
**Status:** Not Started
**Priority:** High
**Effort:** 4-6 hours
**Dependencies:** 1.4, 1.5

**Tasks:**
- [ ] Create `src/generator/writer.ts`
- [ ] Implement output directory management
  - Create `.mist/schema/` directory if not exists
  - Clear old generated files (with safety checks)
- [ ] Write individual schema files
  - One file per table: `.mist/schema/users.ts`
  - Include comments indicating auto-generation
  - Add timestamp of generation
- [ ] Generate index file
  - `.mist/schema/index.ts`
  - Export all schemas
    ```typescript
    export * from './users'
    export * from './posts'
    ```
- [ ] Generate TypeScript type files
  - `.mist/types/users.ts`
  - Infer types from schemas
    ```typescript
    import { users } from '../schema/users'
    export type User = typeof users.$inferSelect
    export type NewUser = typeof users.$inferInsert
    ```
- [ ] Generate types index
  - `.mist/types/index.ts`
  - Export all types
- [ ] Add .gitkeep or README to .mist directory
  - Explain that directory is auto-generated
  - Safe to delete and regenerate
- [ ] Write unit tests
  - Creates directory structure
  - Writes files correctly
  - Handles file system errors

**Acceptance Criteria:**
- Generated files are written to .mist/ directory
- Directory structure is correct
- All necessary files created (schemas, types, indexes)
- File overwrites work correctly
- Error handling for file system issues

### 1.7 Configuration System
**Status:** Not Started
**Priority:** High
**Effort:** 6-8 hours
**Dependencies:** None (can be done in parallel)

**Tasks:**
- [ ] Create `src/config/types.ts`
- [ ] Define configuration interface
  ```typescript
  export interface MistConfig {
    models: string | string[]
    output: string
    connection: string
    conventions?: {
      timestamps?: boolean
      primaryKey?: string
      foreignKeys?: Record<string, string>
      unique?: Record<string, string[]>
      exclude?: string[]
    }
    database?: {
      type?: 'postgres' | 'sqlite'
      schema?: string
    }
    dev?: {
      autoMigrate?: boolean
      watch?: string[]
    }
  }
  ```
- [ ] Create `src/config/loader.ts`
- [ ] Implement config file loading
  - Look for `mist.config.ts` in current directory
  - Support `--config` flag for custom path
  - Use dynamic import for TypeScript config
  - Validate config structure
- [ ] Implement config validation
  - Required fields present
  - Types are correct
  - Paths exist and are accessible
- [ ] Provide sensible defaults
  - Default output: `.mist`
  - Default conventions: timestamps enabled, primaryKey 'id'
  - Auto-detect database type from connection string
- [ ] Write unit tests
  - Load valid config
  - Handle missing config (use defaults)
  - Validate config structure
  - Override defaults correctly

**Acceptance Criteria:**
- Can load mist.config.ts file
- Config is validated properly
- Defaults work when config is minimal
- Clear error messages for invalid config

### 1.8 Integration - End-to-End Schema Generation
**Status:** Not Started
**Priority:** Critical
**Effort:** 6-8 hours
**Dependencies:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7

**Tasks:**
- [ ] Create `src/generator/index.ts` as main entry point
- [ ] Implement generation pipeline
  1. Load configuration
  2. Discover model files (glob patterns)
  3. Parse all interfaces from model files
  4. Analyze conventions
  5. Generate schemas (Postgres or SQLite based on config)
  6. Write output files
- [ ] Add progress logging
  - "Found X model files"
  - "Parsing interfaces..."
  - "Generating schemas..."
  - "Writing to .mist/..."
  - "Done!"
- [ ] Error handling for entire pipeline
  - File not found
  - Parse errors
  - Write errors
  - Clear error messages with context
- [ ] Write integration tests
  - Create sample model files
  - Run full generation
  - Verify output files are correct
  - Test with both Postgres and SQLite
  - Test with various conventions enabled/disabled
- [ ] Performance baseline
  - Measure generation time for 10, 50, 100 tables
  - Should be < 1s for 50 tables

**Acceptance Criteria:**
- Complete pipeline works end-to-end
- Sample models generate correct schemas
- Works for both PostgreSQL and SQLite
- Performance meets requirements
- Error messages are helpful

---

## Phase 2: Runtime Client

### 2.1 Database Connection Management
**Status:** Not Started
**Priority:** Critical
**Effort:** 6-8 hours
**Dependencies:** Phase 1 complete

**Tasks:**
- [ ] Create `src/runtime/connection.ts`
- [ ] Implement connection string detection
  - Detect PostgreSQL: `postgresql://` or `postgres://`
  - Detect SQLite: file path (no protocol) or `sqlite://`
- [ ] Implement PostgreSQL connection
  - Use `postgres` or `pg` driver
  - Create Drizzle instance with `drizzle(client)`
  - Connection pooling support
  - Handle connection errors
- [ ] Implement SQLite connection
  - Use `better-sqlite3` driver
  - Create Drizzle instance with `drizzle(client)`
  - File path validation
  - Create database file if doesn't exist
- [ ] Export connection factory
  ```typescript
  export function createConnection(connectionString: string): DrizzleInstance
  ```
- [ ] Write unit tests
  - Connection string detection
  - Mock connections for both databases
  - Error handling

**Acceptance Criteria:**
- Can connect to PostgreSQL database
- Can connect to SQLite database
- Connection string auto-detection works
- Proper error handling for connection failures

### 2.2 CRUD Operations - Insert
**Status:** Not Started
**Priority:** Critical
**Effort:** 4-6 hours
**Dependencies:** 2.1

**Tasks:**
- [ ] Create `src/runtime/operations.ts`
- [ ] Implement insert operation
  ```typescript
  async function insert<T>(
    db: DrizzleInstance,
    table: DrizzleTable,
    data: T
  ): Promise<T>
  ```
- [ ] Use Drizzle's insert API
  ```typescript
  await db.insert(table).values(data).returning()
  ```
- [ ] Handle auto-generated fields
  - Primary key generation (UUID or serial)
  - Timestamps (createdAt, updatedAt)
- [ ] Return inserted record with generated values
- [ ] Error handling
  - Unique constraint violations
  - Foreign key violations
  - Type validation errors
- [ ] Write unit tests with in-memory SQLite
  - Insert simple record
  - Insert with auto-generated ID
  - Insert with timestamps
  - Handle constraint violations

**Acceptance Criteria:**
- Can insert records successfully
- Returns inserted record with generated fields
- Handles errors gracefully
- Works with both Postgres and SQLite

### 2.3 CRUD Operations - Query (findOne, findMany)
**Status:** Not Started
**Priority:** Critical
**Effort:** 6-8 hours
**Dependencies:** 2.1, 2.2

**Tasks:**
- [ ] Implement findOne operation
  ```typescript
  async function findOne<T>(
    db: DrizzleInstance,
    table: DrizzleTable,
    where: Partial<T>
  ): Promise<T | null>
  ```
- [ ] Use Drizzle's query API
  ```typescript
  await db.select().from(table).where(eq(table.field, value)).limit(1)
  ```
- [ ] Build where clause from object
  - Convert `{ name: 'Alice', age: 30 }` to Drizzle `where(and(...))`
  - Support exact matches only (for MVP)
- [ ] Implement findMany operation
  ```typescript
  async function findMany<T>(
    db: DrizzleInstance,
    table: DrizzleTable,
    where?: Partial<T>
  ): Promise<T[]>
  ```
- [ ] Return empty array if no results (for findMany)
- [ ] Return null if not found (for findOne)
- [ ] Write unit tests
  - Find record by single field
  - Find by multiple fields (AND condition)
  - Find many records
  - Return null/empty array when not found

**Acceptance Criteria:**
- findOne returns single record or null
- findMany returns array of records
- Where clauses work correctly
- Works with both databases

### 2.4 CRUD Operations - Update
**Status:** Not Started
**Priority:** High
**Effort:** 4-6 hours
**Dependencies:** 2.1, 2.2, 2.3

**Tasks:**
- [ ] Implement update operation
  ```typescript
  async function update<T>(
    db: DrizzleInstance,
    table: DrizzleTable,
    where: Partial<T>,
    data: Partial<T>
  ): Promise<number>
  ```
- [ ] Use Drizzle's update API
  ```typescript
  await db.update(table).set(data).where(...)
  ```
- [ ] Build where clause (same as query)
- [ ] Auto-update `updatedAt` timestamp
- [ ] Return number of affected rows
- [ ] Handle errors
  - Unique constraint violations
  - Foreign key violations
- [ ] Write unit tests
  - Update single record
  - Update multiple records
  - Update with no matches (returns 0)
  - Auto-update timestamps

**Acceptance Criteria:**
- Can update records successfully
- updatedAt timestamp auto-updated
- Returns correct affected row count
- Handles constraint errors

### 2.5 CRUD Operations - Delete
**Status:** Not Started
**Priority:** High
**Effort:** 3-4 hours
**Dependencies:** 2.1, 2.2, 2.3

**Tasks:**
- [ ] Implement delete operation
  ```typescript
  async function deleteRecords<T>(
    db: DrizzleInstance,
    table: DrizzleTable,
    where: Partial<T>
  ): Promise<number>
  ```
- [ ] Use Drizzle's delete API
  ```typescript
  await db.delete(table).where(...)
  ```
- [ ] Build where clause (same as query)
- [ ] Return number of deleted rows
- [ ] Handle foreign key constraint errors
  - If other records reference this record
- [ ] Write unit tests
  - Delete single record
  - Delete multiple records
  - Delete with no matches (returns 0)
  - Handle FK constraint errors

**Acceptance Criteria:**
- Can delete records successfully
- Returns correct deleted row count
- Handles FK constraint errors gracefully

### 2.6 Client Generation
**Status:** Not Started
**Priority:** Critical
**Effort:** 8-10 hours
**Dependencies:** 2.1, 2.2, 2.3, 2.4, 2.5

**Tasks:**
- [ ] Create `src/generator/client.ts`
- [ ] Generate client code with typed methods
  ```typescript
  // .mist/client.ts
  import { drizzle } from 'drizzle-orm/...'
  import * as schema from './schema'

  const connection = createConnection(config.connection)

  export const db = {
    users: {
      insert: async (data: NewUser) => { /* ... */ },
      findOne: async (where: Partial<User>) => { /* ... */ },
      findMany: async (where?: Partial<User>) => { /* ... */ },
      update: async (where: Partial<User>, data: Partial<User>) => { /* ... */ },
      delete: async (where: Partial<User>) => { /* ... */ },
    },
    // ... for each table
  }
  ```
- [ ] Generate client factory for each table
  - Import table schema
  - Import types
  - Create wrapper methods that call runtime operations
  - Proper TypeScript types for parameters and return values
- [ ] Export db object with all tables
- [ ] Generate connection initialization
  - Read connection string from config or environment
  - Auto-detect database type
- [ ] Write to `.mist/client.ts`
- [ ] Write unit tests
  - Client code generation
  - Generated code compiles
  - Type safety is maintained

**Acceptance Criteria:**
- Generates working client code
- All CRUD operations available for each table
- Full TypeScript type safety
- Can be imported and used in application code

### 2.7 Integration Tests - Full CRUD Cycle
**Status:** Not Started
**Priority:** High
**Effort:** 6-8 hours
**Dependencies:** 2.1-2.6

**Tasks:**
- [ ] Set up test databases
  - In-memory SQLite for fast tests
  - Optional: Docker Postgres for full tests
- [ ] Create sample models for testing
  - User, Post, Comment (with foreign keys)
- [ ] Write E2E tests
  - Generate schemas from sample models
  - Generate client
  - Connect to test database
  - Run full CRUD cycle:
    1. Insert records
    2. Query records
    3. Update records
    4. Delete records
  - Test foreign key relationships
  - Test constraint violations
- [ ] Test with both PostgreSQL and SQLite
- [ ] Clean up test data after tests

**Acceptance Criteria:**
- E2E tests pass for SQLite
- E2E tests pass for PostgreSQL (if available)
- All CRUD operations work correctly
- Foreign keys work correctly
- Constraints are enforced

---

## Phase 3: CLI & Watch Mode

### 3.1 CLI Framework Setup
**Status:** Not Started
**Priority:** High
**Effort:** 4-6 hours
**Dependencies:** Phase 1, Phase 2

**Tasks:**
- [ ] Create `src/cli/index.ts`
- [ ] Set up Commander.js
  ```typescript
  import { Command } from 'commander'

  const program = new Command()
  program
    .name('mist')
    .description('Convention-based Drizzle ORM schema generator')
    .version('0.1.0')
  ```
- [ ] Add global options
  - `--config <path>` - Path to config file
  - `--verbose` - Verbose output
- [ ] Create bin entry point
  - `bin/mist.js` or `dist/cli.js`
  - Add shebang: `#!/usr/bin/env node`
  - Make executable
- [ ] Add to package.json
  ```json
  "bin": {
    "mist": "./dist/cli.js"
  }
  ```
- [ ] Test CLI runs
  - `npm link` for local testing
  - Run `mist --help`
  - Verify version and help text

**Acceptance Criteria:**
- CLI executes successfully
- Help text displays correctly
- Version command works
- Global options recognized

### 3.2 Generate Command
**Status:** Not Started
**Priority:** Critical
**Effort:** 3-4 hours
**Dependencies:** 3.1

**Tasks:**
- [ ] Create `src/cli/generate.ts`
- [ ] Implement generate command
  ```typescript
  program
    .command('generate')
    .description('Generate Drizzle schemas from TypeScript interfaces')
    .option('--watch', 'Watch for changes')
    .action(async (options) => {
      // Run generator
    })
  ```
- [ ] Load configuration
- [ ] Call schema generator from Phase 1
- [ ] Add progress indicators (ora)
  - Spinner while parsing
  - Spinner while generating
  - Success message with file count
- [ ] Add colored output (chalk)
  - Green for success
  - Red for errors
  - Yellow for warnings
- [ ] Error handling with helpful messages
  - Config not found
  - Model files not found
  - Parse errors with file/line numbers
  - Write errors
- [ ] Write tests
  - Mock generator calls
  - Verify correct output messages

**Acceptance Criteria:**
- `mist generate` runs successfully
- Generates schemas from models
- Progress indicators display
- Error messages are helpful and clear
- Success message shows what was generated

### 3.3 Dev Command - Watch Mode
**Status:** Not Started
**Priority:** Medium
**Effort:** 6-8 hours
**Dependencies:** 3.1, 3.2

**Tasks:**
- [ ] Create `src/cli/dev.ts`
- [ ] Set up chokidar file watcher
  ```typescript
  import chokidar from 'chokidar'

  const watcher = chokidar.watch(config.models, {
    ignored: /node_modules/,
    persistent: true
  })
  ```
- [ ] Implement watch command
  ```typescript
  program
    .command('dev')
    .description('Watch mode with auto-regeneration')
    .action(async () => {
      // Set up watcher
    })
  ```
- [ ] Handle file events
  - On `add` or `change`: regenerate schemas
  - Debounce rapid changes (wait 300ms)
  - Clear console on regeneration (optional)
- [ ] Show status messages
  - "Watching for changes..."
  - "Detected change in src/models/user.ts"
  - "Regenerating schemas..."
  - "Done! (Xms)"
- [ ] Optional: Auto-push schema changes
  - Only in dev mode
  - Use Drizzle Kit push command
  - Show warning about data loss
  - Require config flag: `dev.autoMigrate: true`
- [ ] Handle graceful shutdown
  - Ctrl+C closes watcher cleanly
- [ ] Write tests
  - Mock file watcher
  - Verify regeneration triggered
  - Test debouncing

**Acceptance Criteria:**
- `mist dev` starts watch mode
- Detects file changes correctly
- Regenerates schemas automatically
- Debounces rapid changes
- Clean shutdown on Ctrl+C

### 3.4 Migrate Command (Basic)
**Status:** Not Started
**Priority:** Low (MVP), High (Phase 4)
**Effort:** 2-3 hours (basic stub)
**Dependencies:** 3.1

**Tasks:**
- [ ] Create `src/cli/migrate.ts`
- [ ] Implement basic migrate command stub
  ```typescript
  program
    .command('migrate')
    .description('Run migrations (coming soon)')
    .action(() => {
      console.log('Migration support coming in v1.0!')
    })
  ```
- [ ] Document planned migration functionality
- [ ] This will be fully implemented in Phase 4

**Acceptance Criteria:**
- Command exists but shows "coming soon" message
- Doesn't crash
- User knows feature is planned

### 3.5 CLI Integration Tests
**Status:** Not Started
**Priority:** Medium
**Effort:** 4-6 hours
**Dependencies:** 3.1, 3.2, 3.3

**Tasks:**
- [ ] Set up CLI testing utilities
  - Spawn CLI process in tests
  - Capture stdout/stderr
  - Verify exit codes
- [ ] Test `mist --help`
- [ ] Test `mist --version`
- [ ] Test `mist generate`
  - With sample models
  - Verify files generated
  - Test with missing config (uses defaults)
  - Test with invalid config (shows error)
- [ ] Test `mist dev` (basic)
  - Starts successfully
  - Can be interrupted
- [ ] Test error scenarios
  - Invalid command
  - Missing required options
  - File system errors

**Acceptance Criteria:**
- All CLI commands tested
- Help and version work
- Generate command integration tested
- Error handling verified

---

## Phase 4: Migrations (v1.0)

### 4.1 Schema Diff Detection
**Status:** Not Started (Phase 4)
**Priority:** Medium
**Effort:** 10-12 hours

**Tasks:**
- [ ] Implement schema comparison
  - Compare current generated schema with previous version
  - Detect added tables
  - Detect removed tables
  - Detect added columns
  - Detect removed columns
  - Detect column type changes
  - Detect constraint changes
- [ ] Store schema snapshots
  - Save generated schema metadata
  - Version tracking
- [ ] Write diff algorithm tests

**Acceptance Criteria:**
- Can detect all schema changes
- Diff is accurate and complete
- Snapshots stored reliably

### 4.2 Migration Generation
**Status:** Not Started (Phase 4)
**Priority:** Medium
**Effort:** 12-15 hours

**Tasks:**
- [ ] Generate SQL migration files from diff
- [ ] Support both up and down migrations
- [ ] Handle common migration patterns
  - Add column (with default for existing rows)
  - Drop column
  - Add table
  - Drop table
  - Add index
  - Add constraint
- [ ] Generate safe migrations
  - Warn about data loss operations
  - Suggest manual review
- [ ] Migration file naming
  - Sequential numbers
  - Timestamp-based
  - Descriptive names
- [ ] Write tests for migration generation

**Acceptance Criteria:**
- Generates valid SQL migrations
- Up and down migrations both work
- Safe handling of destructive operations

### 4.3 Migration Runner
**Status:** Not Started (Phase 4)
**Priority:** Medium
**Effort:** 8-10 hours

**Tasks:**
- [ ] Implement migration tracking table
  - Store applied migrations
  - Track timestamps
- [ ] Implement `mist migrate --up`
  - Apply pending migrations in order
  - Skip already-applied migrations
  - Transaction support
  - Rollback on error
- [ ] Implement `mist migrate --down`
  - Rollback last migration
  - Run down migration
- [ ] Implement `mist migrate --reset`
  - Drop all tables
  - Reapply all migrations
  - Confirmation required
- [ ] Write tests for migration runner

**Acceptance Criteria:**
- Migrations apply successfully
- Tracking works correctly
- Rollback works
- Errors handled gracefully

---

## Phase 5: Advanced Features (Post-v1.0)

### 5.1 Relationship Loading
**Status:** Deferred (Phase 5)
**Priority:** Low
**Effort:** 15-20 hours

**Tasks:**
- [ ] Implement include syntax
  ```typescript
  await db.users.findOne({ id: '123' }, {
    include: { posts: true }
  })
  ```
- [ ] Eager loading
- [ ] Nested includes
- [ ] Performance optimization

**Acceptance Criteria:**
- TBD based on community feedback

### 5.2 Advanced Query Operators
**Status:** Deferred (Phase 5)
**Priority:** Low
**Effort:** 10-15 hours

**Tasks:**
- [ ] Implement comparison operators
  - gt, gte, lt, lte
  - in, notIn
  - like, ilike
- [ ] Implement ordering
- [ ] Implement pagination
  - limit, offset
  - cursor-based

**Acceptance Criteria:**
- TBD based on community feedback

### 5.3 Validation Integration
**Status:** Deferred (Phase 5)
**Priority:** Low
**Effort:** 8-10 hours

**Tasks:**
- [ ] Generate Zod schemas from interfaces
- [ ] Runtime validation
- [ ] Custom validators

**Acceptance Criteria:**
- TBD based on community feedback

---

## Pre-Release Tasks

### PR.1 Documentation
**Status:** Not Started
**Priority:** Critical for MVP
**Effort:** 10-15 hours
**Dependencies:** Phase 1, 2, 3 complete

**Tasks:**
- [ ] Write comprehensive README.md
  - Project vision and goals
  - Quick start guide
  - Installation instructions
  - Basic usage example
  - Link to detailed docs
- [ ] Create docs/ directory
  - getting-started.md
  - conventions.md
  - configuration.md
  - api.md
  - faq.md
  - troubleshooting.md
- [ ] Document all conventions
  - Primary keys
  - Timestamps
  - Foreign keys
  - Uniqueness
  - Type mappings
- [ ] Document configuration options
  - All config fields
  - Examples for common scenarios
- [ ] Document CLI commands
  - All commands and options
  - Examples
- [ ] API reference
  - All CRUD operations
  - Type signatures
  - Examples

**Acceptance Criteria:**
- README is clear and complete
- Getting started guide works (tested by someone unfamiliar)
- All features documented
- Examples are correct and tested

### PR.2 Example Projects
**Status:** Not Started
**Priority:** High for MVP
**Effort:** 8-10 hours
**Dependencies:** Phase 1, 2, 3 complete

**Tasks:**
- [ ] Create examples/ directory
- [ ] Create basic example
  - Simple TODO app
  - SQLite database
  - All CRUD operations demonstrated
  - README with instructions
- [ ] Create PostgreSQL example
  - Blog with users, posts, comments
  - Foreign key relationships
  - PostgreSQL-specific features
  - README with setup instructions
- [ ] Create SQLite example
  - Note-taking app
  - Demonstrates SQLite-specific features
  - README
- [ ] Verify all examples work
  - Test fresh install from npm (using npm pack)
  - Follow README instructions
  - All code runs without errors

**Acceptance Criteria:**
- All examples work correctly
- Examples demonstrate key features
- READMEs are clear
- Can be run by beginners

### PR.3 Testing & Quality
**Status:** Not Started
**Priority:** Critical for MVP
**Effort:** 10-15 hours
**Dependencies:** All code complete

**Tasks:**
- [ ] Achieve test coverage goals
  - Unit tests: > 80% coverage
  - Integration tests for all major features
  - E2E tests for complete workflows
- [ ] Run tests in CI
  - Set up GitHub Actions or similar
  - Run on: Node 18, 20, 22
  - Test with: PostgreSQL and SQLite
- [ ] Performance testing
  - Verify < 1s for 50 tables
  - Profile and optimize if needed
- [ ] Security audit
  - Run npm audit
  - Fix vulnerabilities
  - Review generated code for injection risks
- [ ] Code quality
  - ESLint passes
  - Prettier formatting
  - No TypeScript errors
  - No console.logs in production code

**Acceptance Criteria:**
- All tests pass
- Coverage meets goals
- CI/CD set up and passing
- No security vulnerabilities
- Code quality checks pass

### PR.4 Package Publishing Preparation
**Status:** Not Started
**Priority:** Critical for MVP
**Effort:** 4-6 hours
**Dependencies:** All above complete

**Tasks:**
- [ ] Verify package.json is complete
  - Correct name, version, description
  - Keywords for discoverability
  - License: Apache-2.0
  - Repository URL
  - Homepage URL
  - Author information
  - Correct main/types/bin paths
- [ ] Create .npmignore
  - Exclude tests
  - Exclude examples
  - Exclude source maps (optional)
  - Include only dist/ and necessary files
- [ ] Test package locally
  - Run `npm pack`
  - Install tarball in separate project
  - Verify everything works
- [ ] Prepare CHANGELOG.md
  - Document all features in v0.1.0
  - Note breaking changes (none for first release)
- [ ] Create GitHub release
  - Tag v0.1.0
  - Release notes
  - Link to docs
- [ ] Publish to npm
  - `npm publish`
  - Verify package appears on npm
  - Test install from npm

**Acceptance Criteria:**
- Package published successfully
- Can be installed via npm
- All files included correctly
- GitHub release created

---

## Backlog Maintenance

This backlog will be updated as work progresses:
- Tasks marked as completed will be checked off
- New tasks discovered during implementation will be added
- Estimates will be refined based on actual time spent
- Blockers and dependencies will be tracked
- Priorities may shift based on feedback

## Relationships
- **Parent Nodes:** [planning/roadmap.md]
- **Child Nodes:** None (this is the detailed task breakdown)
- **Related Nodes:**
  - [foundation/project_definition.md] - provides context for scope
  - [planning/milestones.md] - tracks milestone completion

## Navigation Guidance
- **Access Context:** Use this document when planning work, breaking down tasks, or tracking implementation progress
- **Common Next Steps:** Pick tasks from Phase 0 or Phase 1 to begin implementation
- **Related Tasks:** Task tracking, sprint planning, progress reporting
- **Update Patterns:** Update after completing tasks, discovering new work, or refining estimates

## Metadata
- **Created:** 2025-11-16
- **Last Updated:** 2025-11-16
- **Updated By:** Claude (AI Agent)

## Change History
- 2025-11-16: Created comprehensive backlog with detailed tasks for all 5 phases
