#!/usr/bin/env node

/**
 * mist-orm CLI
 * Phase 3: CLI & Watch Mode
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import chokidar from 'chokidar'
import { loadConfig } from './config/loader.js'
import { generate } from './generator/index.js'
import { resolve } from 'path'

const program = new Command()

program
  .name('mist')
  .description('Convention-based Drizzle ORM schema generator')
  .version('0.1.0')

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
 * Migrate command - Placeholder for Phase 4
 */
program
  .command('migrate')
  .description('Run migrations (coming in v1.0)')
  .action(() => {
    console.log()
    console.log(chalk.cyan('🚧 Migration Support'))
    console.log()
    console.log('Migration functionality is planned for v1.0 (Phase 4).')
    console.log()
    console.log(chalk.gray('Planned features:'))
    console.log(chalk.gray('  • Automatic schema diff detection'))
    console.log(chalk.gray('  • SQL migration file generation'))
    console.log(chalk.gray('  • Migration tracking and rollback'))
    console.log()
    console.log('For now, you can use Drizzle Kit directly for migrations:')
    console.log(chalk.cyan('  npx drizzle-kit generate:pg'))
    console.log(chalk.cyan('  npx drizzle-kit push:pg'))
    console.log()
  })

// Parse arguments
program.parse()
