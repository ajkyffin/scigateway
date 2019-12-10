describe('Login', () => {
  it('should load login page when login button clicked', () => {
    cy.visit('/');
    cy.title().should('equal', 'SciGateway');

    cy.contains('Sign in').click();

    cy.url().should('include', '/login');
    cy.contains('Username*').should('be.visible');
    cy.contains('Password*').should('be.visible');
  });

  it('should redirect to login page when given any other url', () => {
    cy.visit('/test');

    cy.url().should('include', '/login');
  });

  it('should not allow form submission given invalid credentials', () => {
    cy.visit('/login');

    cy.contains('Username*')
      .parent()
      .find('input')
      .as('usernameInput');

    cy.get('@usernameInput').type('username');

    cy.contains('Username*')
      .parent()
      .parent()
      .contains('button', 'Sign in')
      .as('signInButton');

    cy.get('@signInButton').should('be.disabled');

    cy.get('@usernameInput').clear();

    cy.contains('Password*')
      .parent()
      .find('input')
      .type('password');

    cy.get('@signInButton').should('be.disabled');
  });

  it('should not login given incorrect credentials', () => {
    cy.visit('/login');

    cy.contains('Username*')
      .parent()
      .find('input')
      .type('wrongusername');
    cy.contains('Password*')
      .parent()
      .find('input')
      .type('wrongpassword');

    cy.contains('Username*')
      .parent()
      .parent()
      .contains('button', 'Sign in')
      .click();

    cy.contains('Failed to log in. Invalid username or password.');
  });

  it('should login given correct credentials', () => {
    cy.visit('/login');
    cy.get('button[aria-label="Open navigation menu"]').should(
      'not.be.visible'
    );

    cy.contains('Username*')
      .parent()
      .find('input')
      .type('username');
    cy.contains('Password*')
      .parent()
      .find('input')
      .type('password');

    cy.contains('Username*')
      .parent()
      .parent()
      .contains('button', 'Sign in')
      .click();

    cy.url().should('eq', 'http://127.0.0.1:3000/');

    cy.window().then(
      window =>
        expect(window.localStorage.getItem('scigateway:token')).not.be.null
    );
    cy.get('button[aria-label="Open navigation menu"]').should('be.visible');
  });

  it('should logout successfully', () => {
    cy.login('username', 'password');
    cy.visit('/');
    cy.title().should('equal', 'SciGateway');

    cy.get('[aria-label="Open user menu"]').click();

    cy.contains('Sign out').click();

    cy.contains('Sign in').should('be.visible');

    cy.window().then(
      window => expect(window.localStorage.getItem('scigateway:token')).be.null
    );
  });
});