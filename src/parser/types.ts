/**
 * Types for parsed TypeScript interfaces
 */

/**
 * Represents a property within an interface
 */
export interface ParsedProperty {
  /**
   * Property name
   */
  name: string

  /**
   * TypeScript type as string (e.g., 'string', 'number', 'Date', 'string[]')
   */
  type: string

  /**
   * Whether the property is optional (has ? modifier)
   */
  optional: boolean

  /**
   * JSDoc tags attached to this property
   * @example { unique: 'true', description: 'User email address' }
   */
  jsDocTags: Record<string, string>
}

/**
 * Represents a parsed TypeScript interface
 */
export interface ParsedInterface {
  /**
   * Interface name
   */
  name: string

  /**
   * Properties of the interface
   */
  properties: ParsedProperty[]

  /**
   * Source location information
   */
  location: {
    file: string
    line: number
  }

  /**
   * Interfaces this interface extends (if any)
   */
  extends?: string[]
}

/**
 * Result of parsing a TypeScript file
 */
export interface ParseResult {
  /**
   * All interfaces found in the file
   */
  interfaces: ParsedInterface[]

  /**
   * File path that was parsed
   */
  filePath: string
}
