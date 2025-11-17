// import type { MistConfig } from 'mist-orm' // Uncomment when package is published
import type { MistConfig } from '../../src/config/types'

/**
 * Example configuration file
 * This is what a developer would create to configure mist-orm
 */
export default {
  // Where to find TypeScript interface files
  models: './models/**/*.ts',

  // Where to output generated schemas
  output: './.mist',

  // Database connection string (auto-detects postgres vs sqlite)
  connection: process.env.DATABASE_URL || 'sqlite://./dev.db',

  // Conventions (optional - these are the defaults)
  conventions: {
    timestamps: true, // Auto-add createdAt/updatedAt
    primaryKey: 'id', // Field name for primary key
    foreignKeys: {
      // Custom foreign key mappings (optional)
      // authorId: 'users' - if userId was called authorId
    },
    unique: {
      // Fields that should be unique
      User: ['email'],
    },
  },

  // Database-specific options
  database: {
    type: 'postgres', // or 'sqlite' - auto-detected from connection string
  },
} satisfies MistConfig
