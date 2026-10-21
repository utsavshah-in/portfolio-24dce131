const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateTask, validateRegistration, validateLogin } = require('../../middleware/validate');

function createMockReqRes(body = {}, method = 'POST') {
  const req = { body, method };
  let statusCode = 200;
  let jsonResponse = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(payload) {
      jsonResponse = payload;
      return res;
    }
  };

  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    getStatusCode: () => statusCode,
    getResponse: () => jsonResponse,
    isNextCalled: () => nextCalled
  };
}

describe('Unit Test: Task Validation Middleware (validateTask)', () => {
  it('allows a valid task payload to pass to next()', () => {
    const mock = createMockReqRes({
      title: 'Valid Task Title',
      description: 'A valid task description',
      priority: 'high',
      completed: false
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), true);
    assert.equal(mock.getStatusCode(), 200);
    assert.equal(mock.getResponse(), null);
  });

  it('rejects a task payload when title is missing', () => {
    const mock = createMockReqRes({
      description: 'Description without title',
      priority: 'medium'
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    const resp = mock.getResponse();
    assert.equal(resp.message, 'Validation failed');
    assert.ok(resp.errors.some(e => e.field === 'title' && e.message.includes('required')));
  });

  it('rejects a task payload when title is whitespace only', () => {
    const mock = createMockReqRes({
      title: '    ',
      priority: 'low'
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    const resp = mock.getResponse();
    assert.ok(resp.errors.some(e => e.field === 'title'));
  });

  it('rejects a task title exceeding 160 characters', () => {
    const mock = createMockReqRes({
      title: 'A'.repeat(161),
      priority: 'medium'
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    const resp = mock.getResponse();
    assert.ok(resp.errors.some(e => e.field === 'title' && e.message.includes('160 characters')));
  });

  it('rejects an invalid priority value', () => {
    const mock = createMockReqRes({
      title: 'Task with bad priority',
      priority: 'urgent' // valid values are only: low, medium, high
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    const resp = mock.getResponse();
    assert.ok(resp.errors.some(e => e.field === 'priority'));
  });

  it('allows all three valid priority values (low, medium, high)', () => {
    for (const priority of ['low', 'medium', 'high']) {
      const mock = createMockReqRes({
        title: `Task with ${priority} priority`,
        priority
      });

      validateTask(mock.req, mock.res, mock.next);
      assert.equal(mock.isNextCalled(), true);
    }
  });

  it('rejects non-boolean completed values', () => {
    const mock = createMockReqRes({
      title: 'Task with string completed',
      completed: 'yes'
    });

    validateTask(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    const resp = mock.getResponse();
    assert.ok(resp.errors.some(e => e.field === 'completed'));
  });
});

describe('Unit Test: User Auth Validation (validateRegistration & validateLogin)', () => {
  it('rejects registration when password is shorter than 8 characters', () => {
    const mock = createMockReqRes({
      name: 'Test Student',
      email: 'student@example.com',
      password: '123'
    });

    validateRegistration(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    assert.ok(mock.getResponse().errors.some(e => e.field === 'password'));
  });

  it('rejects registration with invalid email format', () => {
    const mock = createMockReqRes({
      name: 'Test Student',
      email: 'not-an-email',
      password: 'password123'
    });

    validateRegistration(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    assert.ok(mock.getResponse().errors.some(e => e.field === 'email'));
  });

  it('allows valid registration to pass to next()', () => {
    const mock = createMockReqRes({
      name: 'Valid Name',
      email: 'valid.user@example.com',
      password: 'securepassword123'
    });

    validateRegistration(mock.req, mock.res, mock.next);
    assert.equal(mock.isNextCalled(), true);
  });

  it('rejects login when password is missing', () => {
    const mock = createMockReqRes({
      email: 'user@example.com'
    });

    validateLogin(mock.req, mock.res, mock.next);

    assert.equal(mock.isNextCalled(), false);
    assert.equal(mock.getStatusCode(), 400);
    assert.ok(mock.getResponse().errors.some(e => e.field === 'password'));
  });
});
