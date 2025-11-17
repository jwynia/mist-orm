/**
 * CLI integration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { spawn, type ChildProcess } from 'child_process'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'

// Path to the compiled CLI
const CLI_PATH = join(process.cwd(), 'dist', 'cli.js')

/**
 * Helper to run CLI commands and capture output
 */
async function runCLI(args: string[], options: { timeout?: number; input?: string } = {}): Promise<{
  stdout: string
  stderr: string
  exitCode: number | null
}> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors for easier testing
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    // Send input if provided
    if (options.input) {
      child.stdin?.write(options.input)
      child.stdin?.end()
    }

    // Handle timeout
    const timeout = options.timeout || 5000
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`CLI command timed out after ${timeout}ms`))
    }, timeout)

    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({
        stdout,
        stderr,
        exitCode: code,
      })
    })

    child.on('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

describe('CLI', () => {
  describe('--help', () => {
    it('should display help text', async () => {
      const result = await runCLI(['--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Convention-based Drizzle ORM schema generator')
      expect(result.stdout).toContain('Commands:')
      expect(result.stdout).toContain('generate')
      expect(result.stdout).toContain('dev')
      expect(result.stdout).toContain('migrate')
    })
  })

  describe('--version', () => {
    it('should display version number', async () => {
      const result = await runCLI(['--version'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/)
    })
  })

  describe('migrate command', () => {
    it('should show migrate subcommands', async () => {
      const result = await runCLI(['migrate', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Manage database migrations')
      expect(result.stdout).toContain('generate')
      expect(result.stdout).toContain('up')
      expect(result.stdout).toContain('status')
      expect(result.stdout).toContain('reset')
    })
  })

  describe('generate command', () => {
    const testDir = join(process.cwd(), '.test-cli-generate')
    const configPath = join(testDir, 'mist.config.ts')
    const modelsDir = join(testDir, 'models')
    const outputDir = join(testDir, '.mist')

    beforeEach(async () => {
      // Create test directory
      await mkdir(testDir, { recursive: true })
      await mkdir(modelsDir, { recursive: true })
    })

    afterEach(async () => {
      // Clean up test directory
      await rm(testDir, { recursive: true, force: true })
    })

    it('should fail when config file is missing', async () => {
      const result = await runCLI(['generate', '--config', join(testDir, 'nonexistent.ts')])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('Configuration file not found')
    })

    it('should generate schemas from valid config', async () => {
      // Create a simple model file
      const modelContent = `
export interface User {
  id: string
  name: string
  email: string
}
`
      await writeFile(join(modelsDir, 'user.ts'), modelContent)

      // Create config file
      const configContent = `
export default {
  models: '${modelsDir}/**/*.ts',
  output: '${outputDir}',
  connection: 'postgresql://localhost/test',
}
`
      await writeFile(configPath, configContent)

      // Run generate command
      const result = await runCLI(['generate', '--config', configPath])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('users') // Table name
      expect(result.stdout).toContain('Done')
    }, 10000) // Increase timeout for file operations
  })

  describe('dev command', () => {
    it('should show help for dev command', async () => {
      const result = await runCLI(['dev', '--help'])

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Watch mode with auto-regeneration')
      expect(result.stdout).toContain('--no-clear')
    })

    // Note: Full integration test for dev mode would require more complex setup
    // to handle the watching behavior and termination. This is tested manually.
  })

  describe('error handling', () => {
    it('should show error for unknown command', async () => {
      const result = await runCLI(['unknown-command'])

      expect(result.exitCode).toBe(1)
      expect(result.stderr).toContain('unknown command')
    })

    it('should handle invalid options gracefully', async () => {
      const result = await runCLI(['generate', '--invalid-option'])

      expect(result.exitCode).not.toBe(0)
    })
  })
})
