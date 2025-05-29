// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

// This support file is processed and loaded automatically before your test files.

// Add global configuration and behavior that modifies Cypress.
// You can change the location of this file or turn off automatically serving support files
// via the 'supportFile' configuration option.

/* Prevent Cypress from failing tests due to uncaught exceptions from the app
Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
*/