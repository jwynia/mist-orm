/**
 * Example Post model - demonstrates foreign key detection
 */
export interface Post {
  id: string // UUID primary key
  title: string
  content: string
  userId: string // Should be detected as foreign key to users.id
  published: boolean
  createdAt: Date
  updatedAt: Date
}
