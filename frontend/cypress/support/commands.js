// cypress/support/commands.js

// Custom command to create a secret and return reference ID and keys
Cypress.Commands.add('createSecret', (secretText) => {
    let referenceId, keyBase64, ivBase64;

    cy.visit('/');
    cy.get('textarea').type(secretText);

    // Intercept the API call to create secret
    cy.intercept('POST', '/api/secrets').as('createSecretApi');

    cy.contains('button', 'Generate Secret Link').click();

    // Wait for API call to complete
    cy.wait('@createSecretApi').then((interception) => {
        referenceId = interception.response.body.referenceId;
    });

    // Get the generated link with encryption keys
    cy.get('#secretLink').invoke('val').then((link) => {
        const hashPart = link.split('#')[1];
        if (hashPart) {
            const parts = hashPart.split('.');
            keyBase64 = parts[0];
            ivBase64 = parts[1];
        }

        // Return all the values we need for testing
        return cy.wrap({ referenceId, keyBase64, ivBase64, fullLink: link });
    });
});

// Custom command to simulate viewing a secret
Cypress.Commands.add('viewSecret', (referenceId, keyBase64, ivBase64) => {
    // Intercept the API call to consume the secret
    cy.intercept('POST', `/api/secrets/${referenceId}/consume`).as('consumeSecretApi');

    // Visit the page with proper encryption keys
    cy.visit(`/s/${referenceId}#${keyBase64}.${ivBase64}`);

    // Wait for API call to complete
    cy.wait('@consumeSecretApi');
});

// Custom command to check if a secret exists at the backend
Cypress.Commands.add('checkSecretExists', (referenceId) => {
    cy.request({
        method: 'POST',
        url: `/api/secrets/${referenceId}/consume`,
        failOnStatusCode: false
    }).then((response) => {
        return cy.wrap(response.status !== 404 && response.status !== 410);
    });
});