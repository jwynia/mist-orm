# SQLite Example

This example demonstrates using mist-orm with SQLite.

## Setup

1. **Install dependencies:**

```bash
npm install mist-orm drizzle-orm better-sqlite3
```

2. **No database server needed!**

SQLite is file-based. The database file will be created automatically at the path specified in `mist.config.ts` when you first use the client.

## Usage

1. **Generate schemas:**

```bash
npx mist generate
```

This creates:
- `.mist/schema/users.ts` - Drizzle table definition for User
- `.mist/schema/posts.ts` - Drizzle table definition for Post
- `.mist/types/` - TypeScript type definitions
- `.mist/client.ts` - Database client with CRUD operations

2. **Use in development with watch mode:**

```bash
npx mist dev
```

Now any changes to `models/*.ts` will automatically regenerate schemas.

## Example Usage

```typescript
import { db } from './.mist/client'

async function main() {
  // Create a user
  const user = await db.users.insert({
    name: 'Bob',
    email: 'bob@example.com',
    age: 25
  })
  console.log('Created user:', user)

  // Find user
  const found = await db.users.findOne({ email: 'bob@example.com' })
  console.log('Found user:', found)

  // Create a post
  const post = await db.posts.insert({
    title: 'SQLite is Fast!',
    content: 'This is a post stored in SQLite',
    published: true,
    userId: user.id
  })
  console.log('Created post:', post)

  // Query posts
  const posts = await db.posts.findMany({ published: true })
  console.log('Published posts:', posts)

  // Update
  await db.posts.update(
    { id: post.id },
    { title: 'SQLite is Very Fast!' }
  )

  // Delete
  await db.posts.delete({ id: post.id })
  await db.users.delete({ id: user.id })
}

main()
```

## Generated Schema

The generated SQLite schema includes:

**Users table:**
- `id` - INTEGER primary key (auto-increment)
- `name` - text, not null
- `email` - text, not null, unique
- `age` - integer, nullable
- `createdAt` - integer (unix timestamp), auto-generated
- `updatedAt` - integer (unix timestamp), auto-updated

**Posts table:**
- `id` - INTEGER primary key
- `title`, `content` - text fields
- `published` - integer (0 or 1 for false/true)
- `userId` - integer, references users.id
- `createdAt`, `updatedAt` - integer timestamps

## SQLite-Specific Notes

- **File-based**: Database is stored in `./data/app.db` (or path in config)
- **Booleans**: Stored as integers (0 = false, 1 = true)
- **Dates**: Stored as unix timestamps (integers)
- **Arrays/Objects**: Stored as JSON-encoded text
- **No server needed**: Perfect for local development and embedded apps
- **Portable**: Just copy the .db file to move the entire database

## Production Considerations

For production use with SQLite:
- Enable WAL mode for better concurrency
- Use appropriate file permissions
- Consider backups (just copy the .db file)
- SQLite is great for:
  - Mobile apps
  - Desktop applications
  - Edge/embedded systems
  - Low-traffic web apps
  - Development/testing

## Notes

- Don't commit the `.mist/` directory - add it to `.gitignore`
- Don't commit the `data/` directory (contains the database file)
- The database file will be created automatically on first use
