/**
 * Test fixture: Interface with optional fields
 */

export interface Post {
  id: string
  title: string
  content: string
  published?: boolean
  publishedAt?: Date
}
