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
      sourceType: "module",
    },
    rules: {
      // Warn about unused variables, but allow underscore-prefixed args, vars, and caught errors
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",           // ignore args like (_err)
        "varsIgnorePattern": "^_",           // ignore variables like _unused
        "caughtErrorsIgnorePattern": "^_"    // ignore caught errors like catch (_err)
      }],
      "no-undef": "error",                   // prevent usage of undefined variables
      "no-dupe-keys": "error",               // prevent object with duplicate keys
      "no-useless-escape": "error"           // flag unnecessary escape characters
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
        ...globals.jest, // Jest globals for backend tests
      },
    },
    // If some of your backend files (especially older ones or test setup)
    // explicitly use CommonJS (require/module.exports) and are not .cjs,
    // you might need to override sourceType for those specific files.
    // For now, we assume standard Node.js which often mixes module types.
  },

  // Cypress E2E and support files
  {
    files: ["cypress/e2e/**/*.js", "cypress/support/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,  // Browser globals as Cypress runs in a browser
        ...globals.mocha,    // Mocha globals for test structure (describe, it, before, etc.)
        cy: "readonly",      // Cypress 'cy' object
        Cypress: "readonly", // Cypress global object
        expect: "readonly",  // Assertion library often used with Cypress (Chai's expect)
      },
    },
  },

  // Frontend browser scripts
  {
    files: ["public/JS/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser, // Browser globals for frontend scripts
      },
    },
  },

  // Configuration for CommonJS Cypress config file
  {
    files: ["cypress.config.js"],
    languageOptions: {
      sourceType: "commonjs", // Crucial for 'require' and 'module.exports'
      globals: {
        ...globals.node,      // It runs in a Node.js environment
      },
    },
    rules: {
      // Allow 'on' and 'config' parameters in setupNodeEvents to be unused if you're not using them
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^(on|config)$" // Specific ignore for 'on' and 'config' in this file
      }]
    }
  }
]);