// eslint.config.mjs
import js from "@eslint/js";
import globals from "globals"; // Provides global variables for different environments
import { defineConfig } from "eslint/config"; // Correct import for ESLint v9+

export default defineConfig([
  // Base configuration for all JS files
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: [js.configs.recommended], // Correct way to extend recommended config
    languageOptions: {
      ecmaVersion: 2022, // Or your target ECMAScript version
      sourceType: "module", // Assuming you use ES Modules generally
      // If you have mixed modules (CommonJS and ES Modules),
      // you might need more specific overrides or a different default.
      // For now, let's assume ES Modules as default.
    },
    rules: {
      // Relax unused vars rule slightly for common cases (e.g., error in catch)
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "caughtErrors": "all" }],
    }
  },

  // Configuration for Node.js backend files (e.g., controllers, models, server.js)
  {
    files: [
      "backend/**/*.js", // All JS files in the backend directory
      "server.js",      // Your main server file
      "backend/socket.js", // Your socket management file
      "backend/seeders/**/*.js", // Your seeders
      "backend/tests/**/*.js" // Your backend tests (as they run in Node env)
    ],
    languageOptions: {
      globals: {
        ...globals.node, // Add Node.js global variables (like 'process', 'module', '__dirname')
      },
    },
    rules: {
      // If you are using CommonJS syntax (require/module.exports) in some Node files,
      // you might want to explicitly set sourceType to "commonjs" for those files.
      // For example, if you have files that are strictly CommonJS:
      // "files": ["backend/controllers/**/*.js", "backend/models/**/*.js"],
      // "languageOptions": { "sourceType": "commonjs" }
    }
  },

  // Configuration for Browser frontend files (e.g., public/JS/)
  {
    files: ["public/JS/**/*.js"], // All JS files in your public/JS directory
    languageOptions: {
      globals: {
        ...globals.browser, // Add browser global variables (like 'window', 'document', 'alert')
      },
    },
    rules: {
      // If you have specific browser-only rules, add them here
    }
  },

  // Specific rule for CommonJS files if needed (e.g. for module.exports)
  // This is redundant if you've already set sourceType: "commonjs" for backend files,
  // but useful if you have a mix and want to be explicit.
  // { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } }, // Keep if you explicitly need CommonJS source type for all .js files

  // You had this, but it's better to apply globals to specific file sets.
  // { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },
]);