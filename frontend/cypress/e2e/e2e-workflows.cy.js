// cypress/e2e/e2e-workflows.cy.js
import { HomePage } from '../support/pages/HomePage';
import { ViewSecretPage } from '../support/pages/ViewSecretPage';

describe('End-to-End User Workflows', () => {
    const homePage = new HomePage();
    const viewSecretPage = new ViewSecretPage();

    it('should create and view a secret in the same session', () => {
        const secretText = 'End-to-end workflow test secret';

        // Create a secret
        homePage.visit()
            .typeSecret(secretText)
            .submitSecret();

        // Get the generated link and extract components
        cy.get('#secretLink').invoke('val').then((link) => {
            const [url, fragment] = link.split('#');
            const referenceId = url.split('/s/')[1];
            const [keyBase64, ivBase64] = fragment.split('.');

            // First view should succeed
            cy.viewSecret(referenceId, keyBase64, ivBase64);
            cy.contains(secretText).should('be.visible');
            cy.contains('Secret Decrypted').should('be.visible');
            cy.contains('This message has now been permanently deleted').should('be.visible');

            // Navigate away and try second view
            cy.visit('/');
            cy.viewSecret(referenceId, keyBase64, ivBase64);

            // Should show error messages exactly as in view-secret.cy.js
            cy.contains('Secret Not Available').should('be.visible');
            cy.contains('It has already been viewed by someone').should('be.visible');
        });
    });

    it('should test expiration functionality (simulated)', () => {
        const secretText = 'This secret will expire';

        // Create a secret
        cy.createSecret(secretText).then((data) => {
            // Intercept the consume request to simulate expiration
            cy.intercept('POST', `/api/secrets/${data.referenceId}/consume`, {
                statusCode: 410,
                body: { message: 'Secret has expired or already been viewed.' }
            }).as('expiredSecret');

            // Try to view the "expired" secret
            cy.visit(data.fullLink);
            cy.wait('@expiredSecret');

            // Should show expiration error
            cy.contains('Secret Not Available').should('be.visible');
            cy.contains('It has expired').should('be.visible');
        });
    });

    it('should handle rate limiting (simulated)', () => {
        const secretText = 'Rate limited test';

        // Create a secret
        cy.createSecret(secretText).then((data) => {
            // Intercept the consume request to simulate rate limiting
            cy.intercept('POST', `/api/secrets/${data.referenceId}/consume`, {
                statusCode: 429,
                body: { message: 'Too many requests from this IP, please try again after a while.' }
            }).as('rateLimited');

            // Try to view with rate limiting
            cy.visit(data.fullLink);
            cy.wait('@rateLimited');

            // Should show rate limit error
            cy.contains('Too Many Requests').should('be.visible');
            cy.contains('Please wait a moment').should('be.visible');
        });
    });

    it('should navigate to home from error page', () => {
        // Start at an error page (invalid ID)
        viewSecretPage.visit('invalid-id', 'invalid-key', 'invalid-iv');

        // Should show error
        cy.contains('Secret Not Available').should('be.visible');

        // Click the home link
        cy.contains('Create Your Own Secret').click();

        // Should be on home page
        cy.url().should('not.include', '/s/');
        cy.contains('Create a Secret Message').should('be.visible');
    });

    it('should ensure only first viewer sees the secret content', () => {
        const secretText = 'Concurrent access test secret';

        // Create a secret
        homePage.visit()
            .typeSecret(secretText)
            .submitSecret();

        // Get the generated link and extract components
        cy.get('#secretLink').invoke('val').then((link) => {
            const [url, fragment] = link.split('#');
            const referenceId = url.split('/s/')[1];
            const [keyBase64, ivBase64] = fragment.split('.');

            // First viewer starts viewing
            cy.intercept('POST', `/api/secrets/${referenceId}/consume`).as('viewer1');
            cy.viewSecret(referenceId, keyBase64, ivBase64);
            cy.wait('@viewer1');

            // Assert first viewer sees the content (after waiting for response)
            cy.contains(secretText, { timeout: 10000 }).should('be.visible');
            cy.contains('Secret Decrypted').should('be.visible');
            cy.contains('This message has now been permanently deleted').should('be.visible');

            // Create a new session for second viewer
            cy.session('second-viewer', () => {
                // Intercept second viewer's request
                cy.intercept('POST', `/api/secrets/${referenceId}/consume`).as('viewer2');
                cy.viewSecret(referenceId, keyBase64, ivBase64);
                cy.wait('@viewer2').then((interception) => {
                    expect(interception.response.statusCode).to.equal(410);
                });
                cy.contains('Secret Not Available').should('be.visible');
                cy.contains('It has already been viewed by someone').should('be.visible');
            });
        });
    });

    // Test for true concurrent access using direct XHR
    it('should handle truly concurrent requests for the same secret', () => {
        const secretText = 'True concurrent access test';

        // Create a secret
        homePage.visit()
            .typeSecret(secretText)
            .submitSecret();

        cy.get('#secretLink').invoke('val').then((link) => {
            const [url, fragment] = link.split('#');
            const referenceId = url.split('/s/')[1];

            // Store API endpoint
            const apiUrl = `/api/secrets/${referenceId}/consume`;

            // Set up interception to track requests
            cy.intercept('POST', apiUrl).as('consumeRequests');

            // Use JavaScript directly to make multiple concurrent requests
            cy.window().then(win => {
                // Create array to store results
                const results = [];

                // Function to execute an API call and store result
                const makeRequest = () => {
                    return new Promise(resolve => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.open('POST', apiUrl);
                        xhr.setRequestHeader('Content-Type', 'application/json');

                        xhr.onload = function () {
                            results.push({
                                status: xhr.status,
                                response: xhr.responseText
                            });
                            resolve();
                        };

                        xhr.send();
                    });
                };

                // Create 3 concurrent XHR requests
                // Using Promise.all to start them all before waiting for completion
                return Promise.all([
                    makeRequest(),
                    makeRequest(),
                    makeRequest()
                ]).then(() => {
                    // All requests have completed, now verify results
                    cy.wrap(results).should('have.length', 3);

                    // Count successful and error responses
                    const successCount = results.filter(res => res.status === 200).length;
                    const errorCount = results.filter(res => res.status === 404 || res.status === 410).length;

                    // Exactly one request should succeed, others should fail
                    expect(successCount).to.equal(1);
                    expect(errorCount).to.equal(2);

                    // Now visit the page to verify UI
                    cy.visit(`/s/${referenceId}#${fragment}`);

                    // Should show error because the secret was already consumed by XHR
                    cy.contains('Secret Not Available').should('be.visible');
                    cy.contains('It has already been viewed').should('be.visible');
                });
            });
        });
    });
});