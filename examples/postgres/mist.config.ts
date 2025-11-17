/**
 * PostgreSQL Example Configuration
 *
 * This is a complete example showing all configuration options
 * for PostgreSQL setup with mist-orm.
 */

import type { MistConfig } from 'mist-orm'

const config: MistConfig = {
  // Model files to process
  models: './models/**/*.ts',

  // Output directory for generated schemas
  output: './.mist',

  // PostgreSQL connection string
  // Use environment variable for production
  connection: process.env.DATABASE_URL || 'postgresql://localhost:5432/myapp',

  // Convention settings
  conventions: {
    // Auto-add createdAt and updatedAt timestamps
    timestamps: true,

    // Primary key field name
    primaryKey: 'id',

    // Custom foreign key mappings
    // Maps authorId → users.id instead of authors.id
    foreignKeys: {
      authorId: 'users',
    },

    // Unique constraints per table
    unique: {
      User: ['email'],
      Post: ['slug'],
    },

    // Fields to exclude from all tables
    exclude: [],
  },

  // Database-specific settings
  database: {
    // Explicitly set database type (optional - auto-detected from connection)
    type: 'postgres',

    // PostgreSQL schema to use
    schema: 'public',
  },

  // Development mode settings
  dev: {
    // Auto-push schema changes (CAREFUL: can cause data loss)
    autoMigrate: false,

    // Additional paths to watch in dev mode
    watch: [],
  },
}

export default config
