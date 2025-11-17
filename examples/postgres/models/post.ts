/**
 * Post model with foreign key to User
 */

export interface Post {
  title: string
  content: string
  /** @unique */
  slug: string
  published: boolean

  // Foreign key - automatically references users.id
  userId: string

  // Custom foreign key mapping (see mist.config.ts)
  // Maps to users.id instead of authors.id
  authorId: string
}
