/**
 * Main generator entry point - orchestrates the entire schema generation pipeline
 */

import { glob } from 'glob'
import type { ResolvedMistConfig } from '../config/types'
import { parseFile } from '../parser/parser'
import { analyzeInterface } from './analyzer'
import { generatePostgresSchema } from './postgres'
import { generateSqliteSchema } from './sqlite'
import { writeSchemas, type FileSystem, defaultFileSystem } from './writer'

export interface GenerateOptions {
  /**
   * Configuration to use
   */
  config: ResolvedMistConfig

  /**
   * File system implementation (for testing)
   */
  fs?: FileSystem

  /**
   * Progress callback
   */
  onProgress?: (message: string) => void
}

export interface GenerateResult {
  /**
   * Number of interfaces found
   */
  interfacesFound: number

  /**
   * Number of schemas generated
   */
  schemasGenerated: number

  /**
   * Table names that were generated
   */
  tableNames: string[]

  /**
   * Output directory
   */
  outputDir: string

  /**
   * Warnings about circular dependencies or missing references
   */
  warnings: string[]
}

/**
 * Main schema generation pipeline
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { config, fs = defaultFileSystem, onProgress } = options

  // Step 1: Discover model files
  onProgress?.('Discovering model files...')
  const modelPatterns = Array.isArray(config.models) ? config.models : [config.models]
  const modelFiles: string[] = []

  for (const pattern of modelPatterns) {
    const files = await glob(pattern, {
      ignore: ['node_modules/**', 'dist/**', '.mist/**'],
    })
    modelFiles.push(...files)
  }

  if (modelFiles.length === 0) {
    throw new Error(`No model files found matching patterns: ${modelPatterns.join(', ')}`)
  }

  onProgress?.(`Found ${modelFiles.length} model files`)

  // Step 2: Parse all interfaces
  onProgress?.('Parsing TypeScript interfaces...')
  const allInterfaces = []

  for (const file of modelFiles) {
    const parseResult = await parseFile(file)
    allInterfaces.push(...parseResult.interfaces)
  }

  if (allInterfaces.length === 0) {
    throw new Error('No exported interfaces found in model files')
  }

  onProgress?.(`Found ${allInterfaces.length} interfaces`)

  // Step 3: Analyze conventions
  onProgress?.('Analyzing conventions...')
  const analyzedInterfaces = allInterfaces.map(iface => analyzeInterface(iface, config))

  // Step 4: Generate schemas
  onProgress?.(`Generating ${config.database.type} schemas...`)
  const schemas = analyzedInterfaces.map(analyzed => {
    if (config.database.type === 'postgres') {
      return generatePostgresSchema(analyzed)
    } else {
      return generateSqliteSchema(analyzed)
    }
  })

  onProgress?.(`Generated ${schemas.length} schemas`)

  // Step 5: Write output files
  onProgress?.(`Writing schemas to ${config.output}...`)
  const warnings = await writeSchemas(schemas, config.output, fs)

  const tableNames = schemas.map(s => s.tableName)
  onProgress?.(`Done! Generated schemas for: ${tableNames.join(', ')}`)

  // Report warnings if any
  if (warnings.length > 0) {
    for (const warning of warnings) {
      onProgress?.(`⚠️  ${warning}`)
    }
  }

  return {
    interfacesFound: allInterfaces.length,
    schemasGenerated: schemas.length,
    tableNames,
    outputDir: config.output,
    warnings,
  }
}
