/**
 * Post model with foreign key to User
 */

export interface Post {
  title: string
  content: string
  published: boolean

  // Foreign key - automatically references users.id
  userId: string
}
