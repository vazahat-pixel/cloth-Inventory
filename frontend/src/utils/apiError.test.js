import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractApiErrorMessage } from './apiError.js';

describe('extractApiErrorMessage', () => {
    it('returns string errors as-is', () => {
        assert.equal(extractApiErrorMessage('Quantity Mismatch'), 'Quantity Mismatch');
    });

    it('reads API response message', () => {
        const err = { response: { data: { message: 'Insufficient stock' } } };
        assert.equal(extractApiErrorMessage(err), 'Insufficient stock');
    });

    it('maps network errors to friendly text', () => {
        const err = { message: 'Network Error' };
        assert.match(extractApiErrorMessage(err), /connection/i);
    });

    it('uses fallback when error is empty', () => {
        assert.equal(extractApiErrorMessage(null, 'Fallback'), 'Fallback');
    });
});
