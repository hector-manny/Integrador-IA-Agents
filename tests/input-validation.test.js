import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseZipList, validateZipInput } from '../src/adapters/input-validation.js';

describe('input-validation', () => {
  it('validateZipInput accepts valid 5-digit ZIP', () => {
    assert.equal(validateZipInput('80203'), null);
  });

  it('validateZipInput rejects invalid ZIP', () => {
    const error = validateZipInput('abc12');
    assert.ok(error);
    assert.equal(error.code, 'INVALID_ZIP');
  });

  it('parseZipList splits comma-separated string', () => {
    const { validZips, errors } = parseZipList('80203,10001');
    assert.deepEqual(validZips, ['80203', '10001']);
    assert.equal(errors.length, 0);
  });

  it('parseZipList separates valid and invalid ZIPs', () => {
    const { validZips, errors } = parseZipList('abc12,80203');
    assert.deepEqual(validZips, ['80203']);
    assert.equal(errors.length, 1);
    assert.equal(errors[0].code, 'INVALID_ZIP');
  });

  it('parseZipList returns empty for blank comma string', () => {
    const { validZips, errors } = parseZipList('  ,  ');
    assert.deepEqual(validZips, []);
    assert.equal(errors.length, 0);
  });

  it('parseZipList accepts more than 10 ZIPs', () => {
    const zips = Array.from({ length: 11 }, (_, index) =>
      String(80000 + index).padStart(5, '0'),
    );
    const { validZips, errors } = parseZipList(zips);
    assert.equal(validZips.length, 11);
    assert.equal(errors.length, 0);
  });
});
