/**
 * Configuration types for mist-orm
 */

export interface MistConfig {
  /**
   * Glob pattern(s) for finding model files
   * @example './models/star-star-slash-star.ts' (use ** for recursive)
   */
  models: string | string[]

  /**
   * Output directory for generated schemas
   * @default './.mist'
   */
  output: string

  /**
   * Database connection string
   * - PostgreSQL: 'postgresql://...' or 'postgres://...'
   * - SQLite: 'sqlite://./path/to/db.sqlite' or './path/to/db.sqlite'
   */
  connection: string

  /**
   * Convention configuration
   */
  conventions?: {
    /**
     * Auto-add createdAt/updatedAt timestamps
     * @default true
     */
    timestamps?: boolean

    /**
     * Field name for primary key
     * @default 'id'
     */
    primaryKey?: string

    /**
     * Custom foreign key mappings
     * @example { authorId: 'users' }
     */
    foreignKeys?: Record<string, string>

    /**
     * Unique constraint definitions per table
     * @example { User: ['email'], Post: ['slug'] }
     */
    unique?: Record<string, string[]>

    /**
     * Fields to exclude from schema generation
     */
    exclude?: string[]
  }

  /**
   * Database-specific options
   */
  database?: {
    /**
     * Database type (auto-detected from connection string if not specified)
     */
    type?: 'postgres' | 'sqlite'

    /**
     * PostgreSQL schema name
     * @default 'public'
     */
    schema?: string
  }

  /**
   * Development mode options
   */
  dev?: {
    /**
     * Automatically push schema changes in dev mode
     * @default false
     */
    autoMigrate?: boolean

    /**
     * Additional paths to watch for changes
     */
    watch?: string[]
  }
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedMistConfig extends Required<MistConfig> {
  conventions: Required<NonNullable<MistConfig['conventions']>>
  database: Required<NonNullable<MistConfig['database']>>
  dev: Required<NonNullable<MistConfig['dev']>>
}
