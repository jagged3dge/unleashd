import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // E2E tests need longer timeouts (real API calls)
    testTimeout: 60000, // 60 seconds per test
    hookTimeout: 60000, // 60 seconds for setup/teardown
    
    // Run tests serially (not parallel) to avoid port conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // One test file at a time
      },
    },
    
    // Only include E2E test files
    include: ['server/src/__tests__/e2e/**/*.test.ts'],
    
    // Exclude unit tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/__tests__/**/*.test.ts',
      '!server/src/__tests__/e2e/**/*.test.ts', // But include e2e
    ],
    
    // Environment
    environment: 'node',
    
    // Coverage (optional for E2E)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/src/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/dist/**',
      ],
    },
    
    // Globals
    globals: true,
    
    // Reporters
    reporters: ['verbose'],
    
    // Retry flaky tests
    retry: 1, // Retry once if fails (network issues)
  },
  
  resolve: {
    alias: {
      '@unleashd/shared': path.resolve(__dirname, './shared/src'),
    },
  },
});
