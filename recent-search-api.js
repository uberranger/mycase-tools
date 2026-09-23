(function (root) {
    'use strict';

    const categories = { CR: 'Criminal & Citation', CV: 'Civil', FAM: 'Family', PR: 'Probate', APL: 'Appellate', COM: 'Commercial' };
    const dateString = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    function range(days, now = new Date()) {
        const start = new Date(now);
        start.setDate(start.getDate() - Number(days));
        return { start: dateString(start), end: dateString(now) };
    }

    function payload({ category, start, end, court = '', skip = 0 }) {
        if (!Object.hasOwn(categories, category)) throw new Error('Choose a category.');
        const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && dateString(new Date(`${value}T12:00:00`)) === value;
        if (!validDate(start) || !validDate(end) || start > end) throw new Error('Enter a valid filing date range.');
        return {
            Mode: 'ByParty', CaseNum: null, CiteNum: null, CrossRefNum: null,
            First: null, Middle: null, Last: null, Business: null,
            DoBStart: null, DoBEnd: null, OANum: null, BarNum: null, SoundEx: false,
            CourtItemID: court ? Number(court) : null,
            Categories: ['APL', 'COM'].includes(category) ? null : [category],
            Limits: ['APL', 'COM'].includes(category) ? [category] : null,
            Advanced: false, ActiveFlag: 'All', FileStart: start, FileEnd: end,
            CountyCode: null, NewSearch: true, CaptchaAnswer: null,
            Skip: skip, Take: 20, Sort: 'FileDate DESC'
        };
    }

    // The API has returned both nested result collections and top-level arrays.
    function parse(body) {
        if (!body || typeof body !== 'object') throw new Error('MyCase returned an unreadable response.');
        const hasErrors = value => Array.isArray(value) ? value.length > 0 : Boolean(value);
        if (hasErrors(body.Error) || hasErrors(body.Errors) || body.Success === false || body.CaptchaRequired || body.RequireCaptcha) {
            throw new Error('MyCase could not complete the search. Use the normal search to check for a verification prompt, then retry.');
        }
        const rows = new Map();
        let total = null;
        function visit(value) {
            if (!value || typeof value !== 'object') return;
            if (Array.isArray(value)) return value.forEach(visit);
            for (const key of ['TotalResults', 'Total', 'ResultCount', 'TotalCount']) {
                if (total === null && value[key] != null && value[key] !== '' && Number.isFinite(Number(value[key]))) total = Number(value[key]);
            }
            const number = value.CaseNumber || value.caseNumber || value.CauseNumber || value.CaseNo;
            const codes = typeof number === 'string' ? number.trim().match(/^\d{2}([A-Z]\d{2})-\d{4}-([A-Z0-9]{2})-\d+$/i) : null;
            if (typeof number === 'string' && !rows.has(number)) rows.set(number, {
                number, caseToken: value.CaseToken || value.caseToken || null, title: value.Style || value.CaseTitle || value.Caption || '',
                court: codes ? codes[1].toUpperCase() : value.Court || value.CourtName || '',
                type: codes ? codes[2].toUpperCase() : value.CaseType || value.Type || '',
                filed: value.FileDate || value.Filed || '', status: value.Status || value.CaseStatus || ''
            });
            Object.values(value).forEach(visit);
        }
        visit(body);
        if (!rows.size && total !== 0 && !(Array.isArray(body) && !body.length)) {
            throw new Error('MyCase returned an unexpected response. Try the normal search to check for a verification prompt.');
        }
        return { rows: [...rows.values()], total };
    }

    function caseUrl(token) {
        if (typeof token !== 'string' || !token.trim()) return null;
        const state = JSON.stringify({ v: { CaseToken: token } });
        const encoded = btoa(String.fromCharCode(...new TextEncoder().encode(state)));
        return `https://public.courts.in.gov/mycase/#/vw/CaseSummary/${encoded}`;
    }

    const api = { categories, range, payload, parse, caseUrl };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MyCaseRecentSearch = api;
})(globalThis);
