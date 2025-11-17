/**
 * User model
 */

export interface User {
  name: string
  /** @unique */
  email: string
  age?: number
}
