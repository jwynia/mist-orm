#!/usr/bin/env node

/**
 * mist-orm CLI
 * Phase 3: CLI & Watch Mode
 * Phase 4: Migrations
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import chokidar from 'chokidar'
import { loadConfig } from './config/loader.js'
import { generate } from './generator/index.js'
import { createMigration, getMigrationInfo, runMigrations, resetMigrations } from './migrations/index.js'
import { resolve } from 'path'

const program = new Command()

program
  .name('mist')
  .description('Convention-based Drizzle ORM schema generator')
  .version('1.0.0')

// Global options
program.option('-c, --config <path>', 'Path to config file', './mist.config.ts')
program.option('-v, --verbose', 'Verbose output', false)

/**
 * Generate command - Manual schema generation
 */
program
  .command('generate')
  .description('Generate Drizzle schemas from TypeScript interfaces')
  .action(async () => {
    const options = program.opts()
    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded from ${chalk.cyan(options.config)}`)

      // Run generation with progress
      const generationSpinner = ora('Generating schemas...').start()

      const result = await generate({
        config,
        saveSnapshot: true, // Save snapshot for migration tracking
        onProgress: (message) => {
          if (options.verbose) {
            generationSpinner.text = message
          }
        }
      })

      generationSpinner.succeed(
        chalk.green(`Generated ${result.schemasGenerated} schemas for ${result.interfacesFound} interfaces`)
      )

      // Show table names
      console.log(chalk.gray('  Tables:'), result.tableNames.join(', '))
      console.log(chalk.gray('  Output:'), chalk.cyan(result.outputDir))

      // Show warnings if any
      if (result.warnings.length > 0) {
        console.log()
        console.log(chalk.yellow('⚠️  Warnings:'))
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  • ${warning}`))
        })
      }

      console.log()
      console.log(chalk.green('✓ Done!'))

    } catch (error) {
      spinner.fail(chalk.red('Generation failed'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      } else {
        console.error(chalk.red('An unknown error occurred'))
      }

      process.exit(1)
    }
  })

/**
 * Dev command - Watch mode with auto-regeneration
 */
program
  .command('dev')
  .description('Watch mode with auto-regeneration')
  .option('--no-clear', 'Do not clear console on regeneration')
  .action(async (cmdOptions) => {
    const options = program.opts()
    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded from ${chalk.cyan(options.config)}`)

      // Initial generation
      console.log()
      const initialSpinner = ora('Running initial generation...').start()

      try {
        const result = await generate({
          config,
          saveSnapshot: true, // Save snapshot for migration tracking
          onProgress: (message) => {
            if (options.verbose) {
              initialSpinner.text = message
            }
          }
        })

        initialSpinner.succeed(
          chalk.green(`Generated ${result.schemasGenerated} schemas`)
        )
      } catch (error) {
        initialSpinner.fail(chalk.red('Initial generation failed'))
        if (error instanceof Error) {
          console.error(chalk.red('Error:'), error.message)
        }
        process.exit(1)
      }

      // Set up file watcher
      const watchPatterns = Array.isArray(config.models) ? config.models : [config.models]
      const additionalPaths = config.dev.watch || []
      const allWatchPaths = [...watchPatterns, ...additionalPaths]

      console.log()
      console.log(chalk.cyan('👀 Watching for changes...'))
      console.log(chalk.gray('   Patterns:'), allWatchPaths.join(', '))
      console.log(chalk.gray('   Press Ctrl+C to stop'))
      console.log()

      const watcher = chokidar.watch(allWatchPaths, {
        ignored: /(node_modules|dist|\.mist)/,
        persistent: true,
        ignoreInitial: true,
      })

      // Debounce regeneration
      let regenerateTimeout: NodeJS.Timeout | null = null
      let changedFiles = new Set<string>()

      const triggerRegeneration = async () => {
        if (cmdOptions.clear !== false) {
          console.clear()
        }

        console.log(chalk.yellow('🔄 Changes detected'))
        changedFiles.forEach(file => {
          console.log(chalk.gray('   •'), file)
        })
        changedFiles.clear()
        console.log()

        const regenSpinner = ora('Regenerating schemas...').start()
        const startTime = Date.now()

        try {
          const result = await generate({
            config,
            saveSnapshot: true, // Save snapshot for migration tracking
            onProgress: (message) => {
              if (options.verbose) {
                regenSpinner.text = message
              }
            }
          })

          const elapsed = Date.now() - startTime
          regenSpinner.succeed(
            chalk.green(`Generated ${result.schemasGenerated} schemas (${elapsed}ms)`)
          )

          // Show warnings if any
          if (result.warnings.length > 0) {
            console.log(chalk.yellow('⚠️  Warnings:'))
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`  • ${warning}`))
            })
          }

          console.log()
          console.log(chalk.cyan('👀 Watching for changes...'))
          console.log()

        } catch (error) {
          regenSpinner.fail(chalk.red('Regeneration failed'))

          if (error instanceof Error) {
            console.error(chalk.red('Error:'), error.message)
          }

          console.log()
          console.log(chalk.cyan('👀 Watching for changes...'))
          console.log(chalk.gray('   Fix the error and save to retry'))
          console.log()
        }
      }

      const scheduleRegeneration = (filePath: string) => {
        changedFiles.add(filePath)

        if (regenerateTimeout) {
          clearTimeout(regenerateTimeout)
        }

        regenerateTimeout = setTimeout(() => {
          triggerRegeneration()
          regenerateTimeout = null
        }, 300) // 300ms debounce
      }

      watcher.on('add', scheduleRegeneration)
      watcher.on('change', scheduleRegeneration)
      watcher.on('unlink', scheduleRegeneration)

      watcher.on('error', error => {
        console.error(chalk.red('Watcher error:'), error)
      })

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log()
        console.log(chalk.yellow('Stopping watch mode...'))
        watcher.close()
        process.exit(0)
      })

      process.on('SIGTERM', () => {
        watcher.close()
        process.exit(0)
      })

    } catch (error) {
      spinner.fail(chalk.red('Failed to start dev mode'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      }

      process.exit(1)
    }
  })

/**
 * Migrate command group - Phase 4: Migrations
 */
const migrate = program
  .command('migrate')
  .description('Manage database migrations')

/**
 * migrate:generate - Generate new migration from schema changes
 */
migrate
  .command('generate')
  .description('Generate migration from schema changes')
  .action(async () => {
    const options = program.opts()
    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded`)

      // Generate schemas first
      console.log()
      const genSpinner = ora('Generating schemas...').start()

      const result = await generate({
        config,
        saveSnapshot: false, // We'll save it after creating migration
        onProgress: (message) => {
          if (options.verbose) {
            genSpinner.text = message
          }
        }
      })

      genSpinner.succeed(`Generated ${result.schemasGenerated} schemas`)

      // Create migration
      const migrationSpinner = ora('Detecting schema changes...').start()

      const migrationResult = await createMigration(
        result.analyzedInterfaces,
        config,
        {
          apply: false, // Don't apply automatically
          saveSnapshot: true,
        }
      )

      if (!migrationResult.success) {
        migrationSpinner.fail(chalk.red('Migration generation failed'))
        console.error()
        console.error(chalk.red('Error:'), migrationResult.error)
        process.exit(1)
      }

      if (!migrationResult.hasChanges) {
        migrationSpinner.info(chalk.blue('No schema changes detected'))
        console.log()
        console.log('Database schema is up to date.')
        console.log()
        return
      }

      migrationSpinner.succeed(chalk.green('Migration generated'))

      // Show generated migration files
      if (migrationResult.migrationFiles.length > 0) {
        console.log()
        console.log(chalk.cyan('Generated migration files:'))
        migrationResult.migrationFiles.forEach(file => {
          console.log(chalk.gray('  •'), file)
        })
      }

      console.log()
      console.log(chalk.green('✓ Migration ready!'))
      console.log()
      console.log('To apply the migration, run:')
      console.log(chalk.cyan('  mist migrate:up'))
      console.log()

    } catch (error) {
      spinner.fail(chalk.red('Migration generation failed'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      }

      process.exit(1)
    }
  })

/**
 * migrate:up - Apply pending migrations
 */
migrate
  .command('up')
  .description('Apply pending migrations')
  .action(async () => {
    const options = program.opts()
    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded`)

      // Check migration status first
      console.log()
      const statusSpinner = ora('Checking migration status...').start()

      const info = await getMigrationInfo(config)

      if (info.status.upToDate) {
        statusSpinner.info(chalk.blue('Database is up to date'))
        console.log()
        console.log('No pending migrations to apply.')
        console.log()
        return
      }

      statusSpinner.succeed(`Found ${info.status.pending.length} pending migration(s)`)

      // Show pending migrations
      console.log()
      console.log(chalk.cyan('Pending migrations:'))
      info.status.pending.forEach(file => {
        console.log(chalk.gray('  •'), file)
      })

      // Apply migrations
      console.log()
      const applySpinner = ora('Applying migrations...').start()

      const result = await runMigrations(config)

      if (!result.success) {
        applySpinner.fail(chalk.red('Migration failed'))
        console.error()
        console.error(chalk.red('Error:'), result.error)
        process.exit(1)
      }

      applySpinner.succeed(chalk.green('Migrations applied successfully'))

      console.log()
      console.log(chalk.green('✓ Database is up to date!'))
      console.log()

    } catch (error) {
      spinner.fail(chalk.red('Migration failed'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      }

      process.exit(1)
    }
  })

/**
 * migrate:status - Show migration status
 */
migrate
  .command('status')
  .description('Show migration status')
  .action(async () => {
    const options = program.opts()
    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded`)

      // Get migration status
      console.log()
      const statusSpinner = ora('Checking migration status...').start()

      const info = await getMigrationInfo(config)
      statusSpinner.stop()

      // Display status
      console.log()
      console.log(chalk.cyan('📊 Migration Status'))
      console.log()
      console.log('Total migrations:', chalk.bold(info.status.total))
      console.log('Applied:', chalk.green(info.status.applied.length))
      console.log('Pending:', chalk.yellow(info.status.pending.length))
      console.log('Current version:', info.status.currentVersion || chalk.gray('(none)'))
      console.log()

      if (info.status.upToDate) {
        console.log(chalk.green('✓ Database is up to date'))
      } else {
        console.log(chalk.yellow('⚠ Pending migrations need to be applied'))
        console.log()
        console.log(chalk.cyan('Pending migrations:'))
        info.status.pending.forEach(file => {
          console.log(chalk.gray('  •'), file)
        })
        console.log()
        console.log('Run', chalk.cyan('mist migrate:up'), 'to apply them')
      }

      console.log()

      // Show latest snapshot info
      if (info.latestSnapshot) {
        console.log(chalk.gray('Latest snapshot:'), new Date(info.latestSnapshot.timestamp).toLocaleString())
        console.log(chalk.gray('Database type:'), info.latestSnapshot.databaseType)
        console.log(chalk.gray('Tables:'), info.latestSnapshot.schemas.length)
        console.log()
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to get migration status'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      }

      process.exit(1)
    }
  })

/**
 * migrate:reset - Reset all migrations (destructive!)
 */
migrate
  .command('reset')
  .description('Reset all migrations (WARNING: drops all tables)')
  .option('--force', 'Skip confirmation prompt')
  .action(async (cmdOptions) => {
    const options = program.opts()

    // Confirmation prompt
    if (!cmdOptions.force) {
      console.log()
      console.log(chalk.red('⚠️  WARNING: This will drop all tables and reapply all migrations!'))
      console.log(chalk.red('   This operation is destructive and cannot be undone.'))
      console.log()
      console.log('To proceed, run with --force flag:')
      console.log(chalk.cyan('  mist migrate:reset --force'))
      console.log()
      return
    }

    const spinner = ora('Loading configuration...').start()

    try {
      // Load configuration
      const configPath = resolve(process.cwd(), options.config)
      const config = await loadConfig(configPath)
      spinner.succeed(`Configuration loaded`)

      // Reset migrations
      console.log()
      const resetSpinner = ora('Resetting database...').start()

      const result = await resetMigrations(config)

      if (!result.success) {
        resetSpinner.fail(chalk.red('Reset failed'))
        console.error()
        console.error(chalk.red('Error:'), result.error)
        process.exit(1)
      }

      resetSpinner.succeed(chalk.green('Database reset successfully'))

      console.log()
      console.log(chalk.green('✓ All migrations reapplied!'))
      console.log()

    } catch (error) {
      spinner.fail(chalk.red('Reset failed'))
      console.error()

      if (error instanceof Error) {
        console.error(chalk.red('Error:'), error.message)

        if (options.verbose && error.stack) {
          console.error()
          console.error(chalk.gray('Stack trace:'))
          console.error(chalk.gray(error.stack))
        }
      }

      process.exit(1)
    }
  })

// Parse arguments
program.parse()
