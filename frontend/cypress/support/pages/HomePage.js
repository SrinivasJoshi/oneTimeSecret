// cypress/support/pages/HomePage.js
class HomePage {
    visit() {
        cy.visit('/');
        return this;
    }

    typeSecret(text) {
        cy.get('textarea').type(text);
        return this;
    }

    submitSecret() {
        cy.contains('button', 'Generate Secret Link').click();
        return this;
    }

    getGeneratedLink() {
        return cy.get('#secretLink');
    }

    createAnother() {
        cy.contains('button', 'Create Another Secret').click();
        return this;
    }
}

export { HomePage };