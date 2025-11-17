/**
 * Example User model - represents a user in the system
 * This is what a developer would write - a clean TypeScript interface
 */
export interface User {
  id: string // Should become UUID primary key
  name: string
  email: string // Should be unique (via convention or config)
  createdAt: Date // Should auto-add timestamp
  updatedAt: Date // Should auto-add timestamp
}
