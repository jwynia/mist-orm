/**
 * SQLite Example Configuration
 *
 * This is a complete example showing all configuration options
 * for SQLite setup with mist-orm.
 */

import type { MistConfig } from 'mist-orm'

const config: MistConfig = {
  // Model files to process
  models: './models/**/*.ts',

  // Output directory for generated schemas
  output: './.mist',

  // SQLite database file path
  connection: './data/app.db',

  // Convention settings
  conventions: {
    // Auto-add createdAt and updatedAt timestamps
    timestamps: true,

    // Primary key field name
    primaryKey: 'id',

    // Custom foreign key mappings
    foreignKeys: {},

    // Unique constraints per table
    unique: {
      User: ['email'],
    },

    // Fields to exclude from all tables
    exclude: [],
  },

  // Database-specific settings
  database: {
    // Explicitly set database type (optional - auto-detected from connection)
    type: 'sqlite',

    // Schema name not used in SQLite
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
