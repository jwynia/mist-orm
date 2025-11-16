/**
 * Test fixture: Interface with JSDoc annotations
 */

export interface Account {
  id: string

  /**
   * @unique
   */
  email: string

  /**
   * @index
   * @description User's full name
   */
  name: string

  createdAt: Date
}
