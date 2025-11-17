# mist-orm Examples

This directory contains example projects demonstrating how to use mist-orm with different databases.

## Available Examples

### [PostgreSQL Example](./postgres/)

Complete example showing:
- PostgreSQL connection setup
- Full mist.config.ts with all options
- Multiple models with foreign keys
- Custom foreign key mappings
- CRUD operations

**Best for:**
- Web applications
- Multi-user systems
- Complex relational data
- Production deployments

### [SQLite Example](./sqlite/)

Complete example showing:
- SQLite setup (no server required)
- File-based database configuration
- Basic models and relationships
- CRUD operations

**Best for:**
- Local development
- Desktop/mobile applications
- Edge computing
- Embedded systems
- Single-user applications

## Quick Start

1. **Choose an example:**
   ```bash
   cd examples/postgres  # or examples/sqlite
   ```

2. **Install dependencies:**
   ```bash
   npm install mist-orm drizzle-orm postgres  # or better-sqlite3 for SQLite
   ```

3. **Configure connection:**
   - Edit `mist.config.ts` with your database details
   - For PostgreSQL, set up your database first
   - For SQLite, no setup needed!

4. **Generate schemas:**
   ```bash
   npx mist generate
   ```

5. **Start development:**
   ```bash
   npx mist dev
   ```

## Common Configuration Patterns

### Minimal Configuration

```typescript
export default {
  models: './models/**/*.ts',
  output: './.mist',
  connection: 'postgresql://localhost/mydb'
}
```

### With Custom Conventions

```typescript
export default {
  models: './models/**/*.ts',
  output: './.mist',
  connection: 'postgresql://localhost/mydb',
  conventions: {
    timestamps: true,
    foreignKeys: {
      authorId: 'users',  // Custom FK mapping
    },
    unique: {
      User: ['email'],
      Post: ['slug']
    }
  }
}
```

### Using Environment Variables

```typescript
export default {
  models: './models/**/*.ts',
  output: './.mist',
  connection: process.env.DATABASE_URL || 'postgresql://localhost/mydb'
}
```

## Model Examples

### Basic Model

```typescript
export interface User {
  name: string
  email: string
  age?: number  // Optional field
}
```

### With Unique Constraint

```typescript
export interface User {
  name: string
  /** @unique */
  email: string
}
```

### With Foreign Key

```typescript
export interface Post {
  title: string
  content: string
  userId: string  // Auto-creates FK to users.id
}
```

## Generated Files Structure

After running `mist generate`, you'll see:

```
.mist/
├── schema/
│   ├── index.ts        # Exports all schemas
│   ├── users.ts        # Drizzle table definition
│   └── posts.ts        # Drizzle table definition
├── types/
│   ├── index.ts        # Exports all types
│   ├── users.ts        # User, NewUser types
│   └── posts.ts        # Post, NewPost types
└── client.ts           # Database client with CRUD methods
```

**Important:** Add `.mist/` to your `.gitignore`!

## Next Steps

- Read the [main README](../README.md) for full documentation
- Check the [roadmap](../context-network/planning/roadmap.md) for upcoming features
- Review [conventions](../README.md#conventions) to understand auto-generated fields

## Need Help?

- Check the README in each example directory
- See the main [documentation](../README.md)
- Open an [issue](https://github.com/jwynia/mist-orm/issues) if you find problems
