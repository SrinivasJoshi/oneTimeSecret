// cypress/e2e/view-secret.cy.js
import { ViewSecretPage } from '../support/pages/ViewSecretPage';

describe('Secret Viewing Flow', () => {
    const viewSecretPage = new ViewSecretPage();
    let secretData;

    beforeEach(() => {
        // Create a new secret before each test
        const secretText = `Test secret ${Date.now()}`;
        cy.createSecret(secretText).then((data) => {
            secretData = data;
        });
    });

    it('should successfully decrypt and view a secret', () => {
        // Visit the secret view page with the correct keys
        cy.viewSecret(secretData.referenceId, secretData.keyBase64, secretData.ivBase64);

        // Verify the secret is decrypted and displayed
        cy.contains('Viewing Secret Message').should('be.visible');
        cy.contains('Secret Decrypted').should('be.visible');

        // Check deleted confirmation
        cy.contains('This message has now been permanently deleted').should('be.visible');
    });

    it('should not allow viewing the same secret twice', () => {
        // First view
        cy.viewSecret(secretData.referenceId, secretData.keyBase64, secretData.ivBase64);

        // Try to view again
        cy.visit('/'); // Navigate away first
        cy.viewSecret(secretData.referenceId, secretData.keyBase64, secretData.ivBase64);

        // Should show error
        cy.contains('Secret Not Available').should('be.visible');
        cy.contains('It has already been viewed by someone').should('be.visible');
    });

    it('should show error for incorrect decryption key', () => {
        // Visit with wrong key
        const wrongKey = secretData.keyBase64.substring(1) + 'A';
        viewSecretPage.visit(secretData.referenceId, wrongKey, secretData.ivBase64);

        // Should show decryption error
        cy.contains('Decryption Failed').should('be.visible');
    });

    it('should show error for invalid reference ID', () => {
        // Visit with non-existent ID
        viewSecretPage.visit('nonexistent-id', secretData.keyBase64, secretData.ivBase64);

        // Should show not found error
        cy.contains('Secret Not Available').should('be.visible');
    });

    it('should show error for missing fragment', () => {
        // Visit without encryption keys
        viewSecretPage.visit(secretData.referenceId);

        // Should show invalid link error
        cy.contains('Invalid Link Format').should('be.visible');
    });
});