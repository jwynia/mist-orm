/**
 * Migration system - public API
 */

export * from './types'
export * from './snapshot'
export * from './diff'
export * from './generator'
export * from './runner'

import type { ResolvedMistConfig } from '../config/types'
import type { AnalyzedInterface } from '../generator/analyzer'
import { createSnapshot, saveSnapshot, loadSnapshot } from './snapshot'
import { detectChanges } from './diff'
import { generateMigration } from './generator'
import { runMigrations, getMigrationStatus } from './runner'

/**
 * Complete migration workflow
 * 1. Detect changes from previous snapshot
 * 2. Generate migrations if changes detected
 * 3. Optionally apply migrations
 */
export async function createMigration(
  schemas: AnalyzedInterface[],
  config: ResolvedMistConfig,
  options: {
    /**
     * Whether to apply migrations immediately
     */
    apply?: boolean
    /**
     * Whether to save a new snapshot
     */
    saveSnapshot?: boolean
  } = {}
): Promise<{
  success: boolean
  hasChanges: boolean
  migrationFiles: string[]
  output: string
  error?: string
}> {
  try {
    // Load previous snapshot
    const previousSnapshot = await loadSnapshot(config.output)

    // Detect changes
    const diff = detectChanges(previousSnapshot, schemas)

    if (!diff.hasChanges) {
      return {
        success: true,
        hasChanges: false,
        migrationFiles: [],
        output: 'No schema changes detected',
      }
    }

    // Save new snapshot if requested
    if (options.saveSnapshot !== false) {
      const snapshot = createSnapshot(schemas, config.database.type)
      await saveSnapshot(snapshot, config.output)
    }

    // Generate migrations
    const result = await generateMigration(config)

    if (!result.success) {
      return {
        success: false,
        hasChanges: true,
        migrationFiles: [],
        output: result.output,
        error: result.error,
      }
    }

    // Apply migrations if requested
    if (options.apply) {
      const applyResult = await runMigrations(config)

      if (!applyResult.success) {
        return {
          success: false,
          hasChanges: true,
          migrationFiles: result.migrationFiles,
          output: result.output,
          error: `Migrations generated but failed to apply: ${applyResult.error}`,
        }
      }
    }

    return {
      success: true,
      hasChanges: true,
      migrationFiles: result.migrationFiles,
      output: result.output,
    }
  } catch (error) {
    return {
      success: false,
      hasChanges: false,
      migrationFiles: [],
      output: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Get migration status and info
 */
export async function getMigrationInfo(config: ResolvedMistConfig) {
  const status = await getMigrationStatus(config)
  const latestSnapshot = await loadSnapshot(config.output)

  return {
    status,
    latestSnapshot,
  }
}
