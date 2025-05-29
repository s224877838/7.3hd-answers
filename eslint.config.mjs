// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Base configuration for all JavaScript files
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module", // Default for most JS files
    },
    rules: {
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-useless-escape": "error"
    }
  },

  // Node.js backend and test files
  {
    files: [
      "backend/**/*.js",
      "server.js",
      "backend/socket.js",
      "backend/seeders/**/*.js",
      "backend/tests/**/*.js"
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  // Cypress E2E and support files
  {
    files: ["cypress/e2e/**/*.js", "cypress/support/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.mocha,
        cy: "readonly",
        Cypress: "readonly",
        expect: "readonly",
      },
    },
  },

  // Frontend browser scripts
  {
    files: ["public/JS/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Configuration for CommonJS Cypress config file
  {
    files: ["cypress.config.js"],
    languageOptions: {
      sourceType: "commonjs", // Specific to handle CommonJS syntax
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^(on|config)$"
      }]
    }
  },

  // NEW BLOCK: Configuration for PM2 ecosystem.config.js (CommonJS in Node environment)
  {
    files: ["ecosystem.config.js"],
    languageOptions: {
      sourceType: "commonjs", // Explicitly define as CommonJS
      globals: {
        ...globals.node,     // It runs in a Node.js environment
      },
    },
  }
]);