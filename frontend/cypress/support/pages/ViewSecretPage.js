// cypress/support/pages/ViewSecretPage.js
class ViewSecretPage {
    visit(id, key, iv) {
        const fragment = key && iv ? `#${key}.${iv}` : '';
        cy.visit(`/s/${id}${fragment}`);
        return this;
    }

    getDecryptedContent() {
        return cy.get('.whitespace-pre-wrap');
    }

    getErrorMessage() {
        return cy.get('.text-red-600');
    }
}

export { ViewSecretPage };