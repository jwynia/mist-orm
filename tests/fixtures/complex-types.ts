/**
 * Test fixture: Interface with complex types
 */

export interface Product {
  id: string
  name: string
  tags: string[]
  metadata: Record<string, any>
  price: number
  inStock: boolean
}
