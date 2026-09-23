const { test } = require('node:test');
const assert = require('node:assert/strict');
const api = require('../recent-search-api.js');

test('recent filing ranges cross month and year boundaries using local dates', () => {
    assert.deepEqual(api.range(7, new Date(2026, 0, 3, 1)), { start: '2025-12-27', end: '2026-01-03' });
    assert.deepEqual(api.range(1, new Date(2024, 2, 1)), { start: '2024-02-29', end: '2024-03-01' });
});

test('category searches use the existing tool request format without a party name', () => {
    for (const category of ['CR', 'CV', 'FAM', 'PR', 'APL', 'COM']) {
        const payload = api.payload({ category, start: '2026-09-01', end: '2026-09-23', court: '146', skip: 20 });
        assert.equal(payload.Mode, 'ByParty');
        assert.equal(payload.Last, null);
        assert.equal(payload.CourtItemID, 146);
        assert.equal(payload.Skip, 20);
        assert.equal(payload.Take, 20);
        assert.equal(payload.Sort, 'FileDate DESC');
        assert.equal(payload.FileStart, '2026-09-01');
        assert.equal(payload.FileEnd, '2026-09-23');
        const limit = ['APL', 'COM'].includes(category);
        assert.deepEqual(payload.Categories, limit ? null : [category]);
        assert.deepEqual(payload.Limits, limit ? [category] : null);
    }
});

test('invalid dates and categories cannot trigger searches', () => {
    for (const [start, end] of [['2026-09-23', '2026-09-01'], ['2026-02-30', '2026-03-01'], ['', '2026-03-01']]) {
        assert.throws(() => api.payload({ category: 'CV', start, end }), /valid filing date/);
    }
    assert.throws(() => api.payload({ category: 'unknown' }), /category/);
});

test('nested responses preserve case fields and remove duplicates', () => {
    const row = { CaseNumber: '49D01-2609-PL-000001', Style: '<b>Example</b>', Court: 'Example court', FileDate: '09/23/2026', Status: 'Pending' };
    const page = api.parse({ TotalResults: 1, Errors: [], Results: [row, row] });
    assert.equal(page.total, 1);
    assert.equal(page.rows.length, 1);
    assert.equal(page.rows[0].title, '<b>Example</b>');
    assert.equal(page.rows[0].filed, '09/23/2026');
});

test('empty results are distinct from verification and malformed responses', () => {
    assert.deepEqual(api.parse({ TotalResults: 0, Results: [] }), { total: 0, rows: [] });
    assert.deepEqual(api.parse([]), { total: null, rows: [] });
    for (const response of [{ RequireCaptcha: true }, { Errors: ['Search blocked'] }, {}, '<html>verification</html>']) {
        assert.throws(() => api.parse(response));
    }
});

test('manifest loads search scripts only on MyCase and includes each local file', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    const root = path.join(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json')));
    const entry = manifest.content_scripts.find(entry => entry.js.includes('recent-search.js'));
    assert.deepEqual(entry.matches, ['https://public.courts.in.gov/mycase/*']);
    assert.deepEqual(entry.js, ['recent-search-api.js', 'recent-search.js']);
    for (const entry of manifest.content_scripts) {
        for (const file of [...entry.js, ...(entry.css || [])]) assert.ok(fs.existsSync(path.join(root, file)));
    }
});

test('case links encode the returned token in MyCase summary route state', () => {
    const token = 'example_token-123';
    const page = api.parse({ TotalResults: 1, Results: [{ CaseNumber: '49D01-2609-PL-000001', CaseToken: token }] });
    const url = api.caseUrl(page.rows[0].caseToken);
    const prefix = 'https://public.courts.in.gov/mycase/#/vw/CaseSummary/';
    assert.ok(url.startsWith(prefix));
    assert.deepEqual(JSON.parse(Buffer.from(url.slice(prefix.length), 'base64').toString('utf8')), { v: { CaseToken: token } });
    assert.equal(api.caseUrl(null), null);
    assert.equal(api.caseUrl(''), null);
});
