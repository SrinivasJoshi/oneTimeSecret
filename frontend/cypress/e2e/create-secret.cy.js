// cypress/e2e/create-secret.cy.js
import { HomePage } from '../support/pages/HomePage';

describe('Secret Creation Flow', () => {
  const homePage = new HomePage();

  beforeEach(() => {
    homePage.visit();
  });

  it('should create a secret and generate a shareable link', () => {
    const secretText = 'This is a test secret message';

    // Create a secret
    homePage
      .typeSecret(secretText)
      .submitSecret();

    // Verify the success screen is shown
    cy.contains('Your Secret Link is Ready').should('be.visible');
    cy.get('#secretLink').should('exist');

    // Verify important warning messages are shown
    cy.contains('This link can only be viewed once').should('be.visible');
    cy.contains('It will expire in 1 hour').should('be.visible');
  });

  it('should allow creating multiple secrets in succession', () => {
    // Create first secret
    homePage
      .typeSecret('First secret')
      .submitSecret();

    cy.contains('Your Secret Link is Ready').should('be.visible');

    // Create another secret
    homePage
      .createAnother();

    // Verify we're back at the creation screen
    cy.contains('Create a Secret Message').should('be.visible');

    // Create second secret
    homePage
      .typeSecret('Second secret')
      .submitSecret();

    cy.contains('Your Secret Link is Ready').should('be.visible');
  });

  it('should copy the link to clipboard when clicking copy button', () => {
    // Setup clipboard spy
    cy.window().then((win) => {
      cy.stub(win.navigator.clipboard, 'writeText').resolves();
    });

    // Create a secret
    homePage
      .typeSecret('Clipboard test secret')
      .submitSecret();

    // Click the copy button
    cy.get('button[title="Copy"]').click();

    // Verify success message
    cy.contains('Copied!').should('be.visible');

    // Verify clipboard was called with the link
    cy.window().its('navigator.clipboard.writeText')
      .should('be.called');
  });

  it('should validate empty secrets', () => {
    // Submit without typing anything
    homePage.submitSecret();

    // Check that the textarea has the required attribute
    cy.get('textarea')
      .should('have.attr', 'required');

    // Check that the form is invalid
    cy.get('textarea')
      .invoke('prop', 'validity')
      .should('have.property', 'valid', false);
  });
});