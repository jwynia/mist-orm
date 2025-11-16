# Mist

> Convention-based data layer for TypeScript. Write interfaces, get a database.

[![npm version](https://badge.fury.io/js/mist.svg)](https://www.npmjs.com/package/mist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Mist auto-generates [Drizzle ORM](https://orm.drizzle.team/) schemas from your TypeScript interfaces using sensible conventions. No schema files, no boilerplate—just clean domain models and a fully-functional database.

```typescript
// Write this
export interface User {
  name: string
  email: string
}

// Get this (automatically)
// - Database table with id, createdAt, updatedAt
// - Type-safe CRUD operations  
// - Migrations
// - Works with Postgres or SQLite
```

## Why Mist?

**Stop writing schema definitions.** If you're building a typical CRUD app where most tables follow standard patterns (id, timestamps, simple relationships), you're rewriting the same schema boilerplate over and over.

**Mist applies conventions:**
- Every table gets `id`, `createdAt`, `updatedAt`
- `userId` automatically references `users.id`
- TypeScript types map to SQL types
- Interfaces define your schema

**For complex cases,** drop down to explicit Drizzle schemas. Mist is a layer on top, not a replacement.

## Quick Start

Install:

```bash
npm install mist
```

Create a config file:

```typescript
// mist.config.ts
export default {
  models: 'src/models/**/*.ts',
  output: '.mist',
  connection: process.env.DATABASE_URL || './dev.db'
}
```

Define your models:

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
  userId: string  // Auto-detected foreign key
  published: boolean
}
```

Generate and use:

```bash
# Generate schemas
npx mist generate

# Or run in watch mode
npx mist dev
```

```typescript
// Use in your app
import { db } from 'mist'
import type { User, Post } from './models'

const user = await db.users.insert({
  name: 'Alice',
  email: 'alice@example.com'
} as User)

const post = await db.posts.insert({
  title: 'Hello World',
  content: 'My first post',
  userId: user.id,
  published: true
} as Post)

const posts = await db.posts.findMany({ 
  userId: user.id 
} as Post)
```

## Conventions

Mist follows simple, predictable conventions:

### Primary Keys
```typescript
interface User {
  // id: string is added automatically (UUID)
  name: string
}
```

### Timestamps  
```typescript
interface User {
  name: string
  // createdAt: Date - added automatically
  // updatedAt: Date - added automatically  
}
```

### Foreign Keys
```typescript
interface Post {
  title: string
  userId: string  // References users.id
  authorId: string // Can map to users.id via config
}
```

### Uniqueness
```typescript
interface User {
  /** @unique */
  email: string
  
  // Or use naming convention
  usernameUnique: string
}
```

### Nullability
```typescript
interface User {
  name: string    // NOT NULL
  bio?: string    // NULL
}
```

### Type Mapping
```typescript
interface Example {
  text: string           // → TEXT
  count: number          // → INTEGER  
  active: boolean        // → BOOLEAN
  created: Date          // → TIMESTAMP
  tags: string[]         // → TEXT[] (Postgres) or JSON (SQLite)
  metadata: Record<string, any>  // → JSONB (Postgres) or JSON (SQLite)
}
```

## Database Support

Works with both PostgreSQL and SQLite. Mist auto-detects from your connection string:

```typescript
// PostgreSQL
export default {
  connection: 'postgres://user:pass@localhost/db'
}

// SQLite
export default {
  connection: './dev.db'
}
```

Same code, same interfaces, same conventions—works with both.

## CLI Commands

### Generate schemas
```bash
npx mist generate
```

### Development mode (watch + auto-migrate)
```bash
npx mist dev
```

### Run migrations
```bash
npx mist migrate --up
```

### Generate migration from changes
```bash
npx mist migrate --generate
```

## Configuration

Customize conventions in `mist.config.ts`:

```typescript
export default {
  models: 'src/models/**/*.ts',
  output: '.mist',
  connection: process.env.DATABASE_URL,
  
  conventions: {
    timestamps: true,
    primaryKey: 'id',
    
    // Custom foreign key mappings
    foreignKeys: {
      authorId: 'users',
      createdById: 'users'
    },
    
    // Unique constraints
    unique: {
      users: ['email', 'username']
    }
  }
}
```

## API Reference

### Insert
```typescript
const user = await db.users.insert({ 
  name: 'Alice' 
} as User)
```

### Find One
```typescript
const user = await db.users.findOne({ 
  email: 'alice@example.com' 
} as User)
```

### Find Many
```typescript
const users = await db.users.findMany({ 
  age: 25 
} as User)
```

### Update
```typescript
await db.users.update(
  { id: user.id },
  { name: 'Alicia' } as User
)
```

### Delete
```typescript
await db.users.delete({ id: user.id })
```

## What Gets Generated

Mist generates clean, readable Drizzle schemas in the `.mist` directory:

```
.mist/
├── schema/
│   ├── users.ts      # Drizzle table definition
│   ├── posts.ts
│   └── index.ts
├── types/
│   ├── users.ts      # TypeScript types
│   └── index.ts  
├── client.ts         # DB client
└── migrations/       # SQL migrations
```

Generated files are **reviewable but not meant to be edited**. Think of them like `node_modules`—generated artifacts you can inspect but don't modify.

## Escape Hatches

When conventions aren't enough, use explicit Drizzle schemas:

```typescript
// models/user.drizzle.ts
import { users } from '../.mist/schema'
import { pgTable, index } from 'drizzle-orm/pg-core'

export const usersCustom = pgTable('users', {
  ...users,
  // Add custom constraints, indexes, etc.
}, (table) => ({
  emailIdx: index('email_idx').on(table.email)
}))
```

Or override specific fields:

```typescript
export default {
  overrides: {
    users: {
      email: { unique: true, index: true }
    }
  }
}
```

## Examples

Check the [`examples/`](./examples) directory:

- [`basic/`](./examples/basic) - Simple CRUD app
- [`postgres/`](./examples/postgres) - PostgreSQL with relationships
- [`sqlite/`](./examples/sqlite) - SQLite with migrations

## Comparison

### vs Writing Drizzle Directly
- ✅ Less boilerplate (no schema files for simple tables)
- ✅ Conventions reduce decisions
- ⚠️ Less control (but escape hatches available)

### vs Prisma
- ✅ No DSL to learn (just TypeScript)
- ✅ Lighter weight (builds on Drizzle)
- ✅ No separate schema file
- ⚠️ Less mature ecosystem

### vs TypeORM
- ✅ No decorators needed
- ✅ Better TypeScript inference
- ⚠️ Less features (by design)

## Philosophy

**Conventions over configuration.** Most apps have dozens of similar tables. Mist eliminates the repetitive parts while staying out of your way for complex cases.

**TypeScript is the schema.** Your domain models are already defined as interfaces. Why rewrite them as schema definitions?

**Drizzle underneath.** Mist generates standard Drizzle code. You can always drop down to Drizzle for advanced features, and generated code is readable.

**Progressive disclosure.** Start simple (just interfaces), add configuration as needed, use explicit schemas for edge cases.

## Roadmap

- [x] Core schema generation
- [x] PostgreSQL and SQLite support
- [x] Basic CRUD operations
- [x] Migration generation
- [ ] Relationship loading (`include`)
- [ ] Advanced query filters
- [ ] Index support via JSDoc
- [ ] Zod schema generation
- [ ] MySQL support
- [ ] Plugin system

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## FAQ

**Q: Is this production-ready?**  
A: Not yet. Mist is in early development. Use for side projects and provide feedback.

**Q: Can I mix Mist conventions with explicit Drizzle schemas?**  
A: Yes! Use Mist for simple tables, Drizzle for complex ones.

**Q: What about performance?**  
A: Mist generates standard Drizzle code, so performance is identical to hand-written Drizzle.

**Q: Does this work with existing databases?**  
A: Not yet. Currently Mist is for new projects. Database introspection is planned.

**Q: Can I use this with [framework]?**  
A: Yes! Mist is framework-agnostic. Works with Next.js, Express, Fastify, etc.

**Q: How do I handle migrations in production?**  
A: Use `mist migrate --generate` to create migrations, review them, then run `mist migrate --up` in production. Never use auto-migrate in production.

## License

MIT © [Your Name]

## Acknowledgments

Built on top of the excellent [Drizzle ORM](https://orm.drizzle.team/). Inspired by the simplicity of NoSQL libraries and the conventions of Rails/Django ORMs.

---

**Questions?** [Open an issue](https://github.com/yourusername/mist/issues)  
**Ideas?** [Start a discussion](https://github.com/yourusername/mist/discussions)
