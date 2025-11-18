/**
 * Shared test utilities for integration tests
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { rm, mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import postgres from 'postgres'

const execAsync = promisify(exec)

/**
 * PostgreSQL connection details from devcontainer
 */
export const POSTGRES_CONFIG = {
  host: 'postgres',
  port: 5432,
  database: 'mist_dev',
  user: 'mist_user',
  password: 'mist-orm-2025!',
  connectionString: 'postgresql://mist_user:mist-orm-2025!@postgres:5432/mist_dev',
}

/**
 * Creates a temporary test directory with models
 */
export async function createTestProject(
  name: string,
  models: Record<string, string>
): Promise<{ projectDir: string; modelsDir: string; outputDir: string; configPath: string }> {
  const projectDir = join('/tmp', `mist-test-${name}-${Date.now()}`)
  const modelsDir = join(projectDir, 'models')
  const outputDir = join(projectDir, '.mist')
  const configPath = join(projectDir, 'mist.config.ts')

  // Create directories
  await mkdir(projectDir, { recursive: true })
  await mkdir(modelsDir, { recursive: true })

  // Create package.json with drizzle-orm as dependency
  // This is needed for drizzle-kit to resolve schema imports
  const packageJson = {
    name: `mist-test-${name}`,
    version: '1.0.0',
    type: 'module',
    dependencies: {
      'drizzle-orm': '^0.44.7',
    },
  }
  await writeFile(join(projectDir, 'package.json'), JSON.stringify(packageJson, null, 2))

  // Link node_modules from main project instead of installing (faster for tests)
  await execAsync(`ln -s /workspaces/mist-orm/node_modules ${projectDir}/node_modules`)

  // Write model files
  for (const [filename, content] of Object.entries(models)) {
    await writeFile(join(modelsDir, filename), content)
  }

  return { projectDir, modelsDir, outputDir, configPath }
}

/**
 * Cleans up a test project directory
 */
export async function cleanupTestProject(projectDir: string): Promise<void> {
  await rm(projectDir, { recursive: true, force: true })
}

/**
 * Writes a mist config file
 */
export async function writeConfig(
  configPath: string,
  modelsDir: string,
  outputDir: string,
  connectionString: string
): Promise<void> {
  const config = `
export default {
  models: '${modelsDir}/**/*.ts',
  output: '${outputDir}',
  connection: '${connectionString}',
}
`
  await writeFile(configPath, config)
}

/**
 * Runs mist CLI command
 */
export async function runMistCLI(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const cliPath = join(process.cwd(), 'dist', 'cli.js')
  const { stdout, stderr } = await execAsync(`node ${cliPath} ${args.join(' ')}`)
  return { stdout, stderr }
}

/**
 * Gets a PostgreSQL connection
 */
export function getPostgresConnection() {
  return postgres(POSTGRES_CONFIG.connectionString)
}

/**
 * Drops all tables in the test database (for cleanup)
 */
export async function cleanPostgresDatabase(): Promise<void> {
  const sql = getPostgresConnection()

  try {
    // Get all tables
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `

    // Drop each table
    for (const { tablename } of tables) {
      await sql.unsafe(`DROP TABLE IF EXISTS "${tablename}" CASCADE`)
    }
  } finally {
    await sql.end()
  }
}

/**
 * Checks if a table exists in PostgreSQL
 */
export async function tableExists(tableName: string): Promise<boolean> {
  const sql = getPostgresConnection()

  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = ${tableName}
      )
    `
    return result[0].exists
  } finally {
    await sql.end()
  }
}
