import { defineConfig } from 'vitest/config'

/**
 * Vitest configuration for INTEGRATION TESTS ONLY
 *
 * IMPORTANT: These tests are NOT part of the regular test suite.
 * They test against real databases and should only be run manually.
 *
 * DO NOT include these in CI/CD pipelines.
 */
export default defineConfig({
  test: {
    // Use node environment for database operations
    environment: 'node',

    // Integration tests in separate directory
    include: ['tests-integration/**/*.test.ts'],

    // Longer timeout for database operations
    testTimeout: 30000,

    // Run tests serially to avoid database conflicts
    sequence: {
      concurrent: false,
    },

    // Disable coverage for integration tests
    coverage: {
      enabled: false,
    },

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true,
  },
})
