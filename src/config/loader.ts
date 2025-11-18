/**
 * Configuration loading and resolution
 */

import type { MistConfig, ResolvedMistConfig } from './types'

/**
 * Detects database type from connection string
 */
export function detectDatabaseType(connection: string): 'postgres' | 'sqlite' {
  if (connection.startsWith('postgresql://') || connection.startsWith('postgres://')) {
    return 'postgres'
  }
  if (connection.startsWith('sqlite://') || connection.includes('.db') || connection.includes('.sqlite')) {
    return 'sqlite'
  }
  // Default to postgres for unknown formats
  return 'postgres'
}

/**
 * Validates configuration and throws if invalid
 */
function validateConfig(config: any): asserts config is MistConfig {
  if (!config) {
    throw new Error('Configuration is required')
  }

  if (!config.models) {
    throw new Error('Configuration field "models" is required')
  }

  if (typeof config.models !== 'string' && !Array.isArray(config.models)) {
    throw new Error('Configuration field "models" must be a string or array of strings')
  }

  if (Array.isArray(config.models) && !config.models.every((m: any) => typeof m === 'string')) {
    throw new Error('Configuration field "models" must be a string or array of strings')
  }

  if (!config.output) {
    throw new Error('Configuration field "output" is required')
  }

  if (typeof config.output !== 'string') {
    throw new Error('Configuration field "output" must be a string')
  }

  if (!config.connection) {
    throw new Error('Configuration field "connection" is required')
  }

  if (typeof config.connection !== 'string') {
    throw new Error('Configuration field "connection" must be a string')
  }
}

/**
 * Resolves configuration with defaults
 */
export function resolveConfig(config: MistConfig): ResolvedMistConfig {
  validateConfig(config)

  const dbType = config.database?.type ?? detectDatabaseType(config.connection)

  return {
    models: config.models,
    output: config.output,
    connection: config.connection,
    conventions: {
      timestamps: config.conventions?.timestamps ?? true,
      primaryKey: config.conventions?.primaryKey ?? 'id',
      foreignKeys: config.conventions?.foreignKeys ?? {},
      unique: config.conventions?.unique ?? {},
      exclude: config.conventions?.exclude ?? [],
    },
    database: {
      type: dbType,
      schema: config.database?.schema ?? 'public',
    },
    dev: {
      autoMigrate: config.dev?.autoMigrate ?? false,
      watch: config.dev?.watch ?? [],
    },
  }
}

/**
 * Loads configuration from file
 */
export async function loadConfig(configPath: string = './mist.config.ts'): Promise<ResolvedMistConfig> {
  try {
    // Use jiti for runtime TypeScript/ESM loading
    const { createJiti } = await import('jiti')
    const jiti = createJiti(import.meta.url, { interopDefault: true })

    const config = jiti(configPath) as MistConfig

    return resolveConfig(config)
  } catch (error) {
    if ((error as any).code === 'ERR_MODULE_NOT_FOUND' || (error as any).code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `Configuration file not found at ${configPath}. ` +
        'Create a mist.config.ts file or specify --config <path>'
      )
    }
    throw error
  }
}
