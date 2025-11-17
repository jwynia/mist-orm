/**
 * Schema snapshot management
 */

import { createHash } from 'node:crypto'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { AnalyzedInterface } from '../generator/analyzer'
import type { SchemaSnapshot } from './types'

/**
 * Generate a hash for schemas for quick comparison
 */
export function hashSchemas(schemas: AnalyzedInterface[]): string {
  // Sort schemas by table name for consistent hashing
  const sorted = [...schemas].sort((a, b) => a.tableName.localeCompare(b.tableName))

  // Create a stable string representation
  const representation = JSON.stringify(sorted, null, 0)

  // Generate SHA-256 hash
  return createHash('sha256').update(representation).digest('hex')
}

/**
 * Create a snapshot of current schemas
 */
export function createSnapshot(
  schemas: AnalyzedInterface[],
  databaseType: 'postgres' | 'sqlite'
): SchemaSnapshot {
  const now = new Date().toISOString()

  return {
    timestamp: now,
    version: now, // Use ISO timestamp as version
    databaseType,
    schemas,
    hash: hashSchemas(schemas),
  }
}

/**
 * Get the snapshot directory path
 */
export function getSnapshotDir(outputDir: string): string {
  return path.join(outputDir, 'snapshots')
}

/**
 * Get the path for a specific snapshot file
 */
export function getSnapshotPath(outputDir: string, version: string): string {
  // Sanitize version for filename (replace colons with dashes)
  const safeVersion = version.replace(/:/g, '-')
  return path.join(getSnapshotDir(outputDir), `${safeVersion}.json`)
}

/**
 * Get the path for the latest snapshot symlink
 */
export function getLatestSnapshotPath(outputDir: string): string {
  return path.join(getSnapshotDir(outputDir), 'latest.json')
}

/**
 * Save a snapshot to disk
 */
export async function saveSnapshot(
  snapshot: SchemaSnapshot,
  outputDir: string
): Promise<string> {
  const snapshotDir = getSnapshotDir(outputDir)
  const snapshotPath = getSnapshotPath(outputDir, snapshot.version)
  const latestPath = getLatestSnapshotPath(outputDir)

  // Ensure snapshot directory exists
  await fs.mkdir(snapshotDir, { recursive: true })

  // Write snapshot file
  await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8')

  // Update latest symlink (or copy on Windows)
  try {
    // Remove existing latest
    try {
      await fs.unlink(latestPath)
    } catch {
      // Ignore if doesn't exist
    }

    // Try to create symlink (works on Unix-like systems)
    try {
      await fs.symlink(path.basename(snapshotPath), latestPath)
    } catch {
      // Fall back to copy on Windows
      await fs.copyFile(snapshotPath, latestPath)
    }
  } catch (error) {
    // If symlink/copy fails, just log it - not critical
    console.warn('Warning: Could not create latest snapshot link:', error)
  }

  return snapshotPath
}

/**
 * Load a specific snapshot from disk
 */
export async function loadSnapshot(
  outputDir: string,
  version?: string
): Promise<SchemaSnapshot | null> {
  try {
    const snapshotPath = version
      ? getSnapshotPath(outputDir, version)
      : getLatestSnapshotPath(outputDir)

    const content = await fs.readFile(snapshotPath, 'utf-8')
    return JSON.parse(content) as SchemaSnapshot
  } catch (error) {
    // Snapshot doesn't exist
    return null
  }
}

/**
 * List all available snapshots
 */
export async function listSnapshots(outputDir: string): Promise<SchemaSnapshot[]> {
  const snapshotDir = getSnapshotDir(outputDir)

  try {
    const files = await fs.readdir(snapshotDir)
    const snapshots: SchemaSnapshot[] = []

    for (const file of files) {
      // Skip the 'latest.json' symlink/copy
      if (file === 'latest.json') {
        continue
      }

      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(snapshotDir, file), 'utf-8')
        snapshots.push(JSON.parse(content) as SchemaSnapshot)
      }
    }

    // Sort by timestamp (newest first)
    return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  } catch (error) {
    // Directory doesn't exist or is empty
    return []
  }
}

/**
 * Delete old snapshots, keeping only the N most recent
 */
export async function pruneSnapshots(
  outputDir: string,
  keepCount: number = 10
): Promise<number> {
  const snapshots = await listSnapshots(outputDir)

  if (snapshots.length <= keepCount) {
    return 0
  }

  // Delete oldest snapshots
  const toDelete = snapshots.slice(keepCount)
  let deleted = 0

  for (const snapshot of toDelete) {
    try {
      const snapshotPath = getSnapshotPath(outputDir, snapshot.version)
      await fs.unlink(snapshotPath)
      deleted++
    } catch (error) {
      console.warn(`Warning: Could not delete snapshot ${snapshot.version}:`, error)
    }
  }

  return deleted
}
