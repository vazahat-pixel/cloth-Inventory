/**
 * Idempotency middleware tests
 * Run: node --test src/tests/idempotency.test.js
 */
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

function loadMiddleware() {
    const modPath = path.resolve(__dirname, '../middlewares/idempotency.middleware.js');
    delete require.cache[modPath];
    return require('../middlewares/idempotency.middleware');
}

function createMockRes() {
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
        on() {},
    };
    return res;
}

describe('idempotency middleware', () => {
    let idempotency;

    beforeEach(() => {
        ({ idempotency } = loadMiddleware());
    });

    it('passes through when no idempotency key is provided', () => {
        let called = false;
        const req = { method: 'POST', headers: {}, originalUrl: '/api/dispatch', user: { _id: 'u1' } };
        const res = createMockRes();
        const next = () => { called = true; };
        idempotency(req, res, next);
        assert.equal(called, true);
    });

    it('replays cached successful responses', () => {
        const req = {
            method: 'POST',
            headers: { 'idempotency-key': 'key-1' },
            originalUrl: '/api/dispatch/1/confirm',
            user: { _id: 'u1' },
        };
        const res1 = createMockRes();
        let nextCalled = false;
        idempotency(req, res1, () => { nextCalled = true; });
        assert.equal(nextCalled, true);
        res1.status(200).json({ success: true, dispatch: { id: 'd1' } });

        const res2 = createMockRes();
        let replayed = false;
        idempotency(req, res2, () => { replayed = true; });
        assert.equal(replayed, false);
        assert.equal(res2.statusCode, 200);
        assert.deepEqual(res2.body, { success: true, dispatch: { id: 'd1' } });
    });

    it('returns 409 for duplicate in-flight requests', () => {
        const req = {
            method: 'POST',
            headers: { 'idempotency-key': 'in-flight-key' },
            originalUrl: '/api/dispatch/combine-dispatch',
            user: { _id: 'u1' },
        };
        const res1 = createMockRes();
        idempotency(req, res1, () => {});

        const res2 = createMockRes();
        let nextCalled = false;
        idempotency(req, res2, () => { nextCalled = true; });
        assert.equal(nextCalled, false);
        assert.equal(res2.statusCode, 409);
        assert.equal(res2.body.code, 'IDEMPOTENCY_IN_FLIGHT');
    });
});
