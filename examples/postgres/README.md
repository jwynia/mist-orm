# PostgreSQL Example

This example demonstrates using mist-orm with PostgreSQL.

## Setup

1. **Install dependencies:**

```bash
npm install mist-orm drizzle-orm postgres
```

2. **Start PostgreSQL:**

```bash
# Using Docker
docker run -d \
  --name postgres-mist \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=myapp \
  -p 5432:5432 \
  postgres:16

# Or use your existing PostgreSQL installation
```

3. **Configure connection:**

Edit `mist.config.ts` to match your PostgreSQL connection:

```typescript
connection: 'postgresql://postgres:postgres@localhost:5432/myapp'
```

Or use environment variables:

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
```

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
    name: 'Alice',
    email: 'alice@example.com',
    age: 30
  })
  console.log('Created user:', user)

  // Find user
  const found = await db.users.findOne({ email: 'alice@example.com' })
  console.log('Found user:', found)

  // Create a post
  const post = await db.posts.insert({
    title: 'Hello World',
    content: 'This is my first post',
    slug: 'hello-world',
    published: true,
    userId: user.id,
    authorId: user.id
  })
  console.log('Created post:', post)

  // Query posts
  const posts = await db.posts.findMany({ published: true })
  console.log('Published posts:', posts)

  // Update
  await db.posts.update(
    { id: post.id },
    { title: 'Hello World (Updated)' }
  )

  // Delete
  await db.posts.delete({ id: post.id })
  await db.users.delete({ id: user.id })
}

main()
```

## Generated Schema

The generated PostgreSQL schema includes:

**Users table:**
- `id` - UUID primary key with `defaultRandom()`
- `name` - text, not null
- `email` - text, not null, unique
- `age` - integer, nullable
- `createdAt` - timestamp, auto-generated
- `updatedAt` - timestamp, auto-updated

**Posts table:**
- `id` - UUID primary key
- `title`, `content` - text fields
- `slug` - text, unique
- `published` - boolean
- `userId` - UUID, references users.id
- `authorId` - UUID, references users.id (custom mapping)
- `createdAt`, `updatedAt` - timestamps

## Notes

- Don't commit the `.mist/` directory - add it to `.gitignore`
- Use Drizzle Kit for migrations until Phase 4 is complete
- For production, use connection pooling and proper environment variables
