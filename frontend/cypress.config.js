// cypress.config.js
import { defineConfig } from 'cypress';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 800,
  defaultCommandTimeout: 5000,

  e2e: {
    baseUrl: 'http://localhost:80', // Match your app port from docker-compose
    setupNodeEvents(on, config) {
      // implement node event listeners here, if needed
    },
  },

  env: {
    // Add any environment variables for tests here
    apiUrl: '/api',
  },

  // Configure retries for more reliable tests
  retries: {
    runMode: 2,
    openMode: 0,
  },
});