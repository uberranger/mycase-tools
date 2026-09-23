(function () {
    'use strict';
    const api = globalThis.MyCaseRecentSearch;
    let mounted = null;

    function mount(tabs) {
        const tab = document.createElement('li');
        tab.setAttribute('role', 'presentation');
        tab.innerHTML = '<a href="#" id="tabByRecent" role="tab" aria-selected="false" aria-controls="mycase-recent-panel">Recent</a>';
        const panel = document.createElement('section');
        panel.id = 'mycase-recent-panel';
        panel.className = 'panel panel-default panel-tab-body';
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', 'tabByRecent');
        panel.hidden = true;
        panel.innerHTML = `<div class="panel-body">
            <form class="recent-form">
                <div class="recent-fields">
                    <label>Category<select name="category" class="form-control" required></select></label>
                    <label>Filed<select name="recency" class="form-control">
                        <option value="1">Past day</option><option value="7" selected>Past 7 days</option>
                        <option value="30">Past 30 days</option><option value="90">Past 90 days</option>
                        <option value="custom">Custom dates</option>
                    </select></label>
                    <label>Court<select name="court" class="form-control"><option value="">All Odyssey Courts</option></select></label>
                    <label>From<input name="start" type="date" class="form-control" required></label>
                    <label>Through<input name="end" type="date" class="form-control" required></label>
                </div>
                <p>Search by filing date, newest first. Select a case number to open its case summary.</p>
                <button class="btn btn-primary" type="submit">Search recent cases</button>
            </form>
            <p class="recent-status" role="status" aria-live="polite"></p>
            <div class="recent-results table-responsive"></div>
            <div class="recent-pagination" hidden>
                <button type="button" class="btn btn-default recent-previous">Previous</button>
                <button type="button" class="btn btn-default recent-next">Next</button>
            </div>
        </div>`;
        const form = panel.querySelector('form');
        const fields = form.elements;
        const status = panel.querySelector('.recent-status');
        const results = panel.querySelector('.recent-results');
        const pagination = panel.querySelector('.recent-pagination');
        const previous = panel.querySelector('.recent-previous');
        const next = panel.querySelector('.recent-next');
        for (const [value, label] of Object.entries(api.categories)) fields.category.add(new Option(label, value));
        let active = false;
        let controller = null;
        let savedQuery = null;
        let currentSkip = 0;
        const hidden = new Set();
        const selection = new Map();

        function updateDates() {
            if (fields.recency.value === 'custom') return;
            const dates = api.range(fields.recency.value);
            fields.start.value = dates.start;
            fields.end.value = dates.end;
        }
        updateDates();
        fields.recency.addEventListener('change', updateDates);
        for (const field of [fields.start, fields.end]) field.addEventListener('input', () => { fields.recency.value = 'custom'; });

        function hideNative() {
            if (!active) return;
            const elements = [...tabs.parentElement.children].filter(node => node !== tabs && node !== panel);
            document.querySelectorAll('button[data-bind*="searchClick"], a[data-bind*="searchClick"], button[data-bind*="resetClick"], a[data-bind*="resetClick"]').forEach(node => elements.push(node));
            for (const node of elements) {
                if (!node.classList.contains('mycase-recent-hidden')) {
                    node.classList.add('mycase-recent-hidden');
                    hidden.add(node);
                }
            }
        }
        function close() {
            active = false;
            controller?.abort();
            controller = null;
            if (form.querySelector('button').disabled) status.textContent = 'Search stopped. Please try again.';
            form.querySelector('button').disabled = false;
            panel.hidden = true;
            tab.classList.remove('active');
            tabs.classList.remove('mycase-recent-active');
            tab.firstElementChild.setAttribute('aria-selected', 'false');
            for (const [node, value] of selection) {
                if (value === null) node.removeAttribute('aria-selected');
                else node.setAttribute('aria-selected', value);
            }
            selection.clear();
            hidden.forEach(node => node.classList.remove('mycase-recent-hidden'));
            hidden.clear();
        }
        function nativeClick(event) {
            if (active && event.target.closest('[role="tab"]') !== tab.firstElementChild) close();
        }
        tabs.addEventListener('click', nativeClick, true);
        tab.firstElementChild.addEventListener('click', event => {
            event.preventDefault();
            if (active) return;
            active = true;
            tabs.querySelectorAll('[role="tab"]').forEach(node => {
                if (node === tab.firstElementChild) return;
                selection.set(node, node.getAttribute('aria-selected'));
                node.setAttribute('aria-selected', 'false');
            });
            const court = document.querySelector('select[data-bind*="CourtItemID"]');
            if (court?.options.length) {
                const old = fields.court.value;
                fields.court.replaceChildren(...Array.from(court.options, option => option.cloneNode(true)));
                if ([...fields.court.options].some(option => option.value === old)) fields.court.value = old;
            }
            panel.hidden = false;
            tab.classList.add('active');
            tabs.classList.add('mycase-recent-active');
            tab.firstElementChild.setAttribute('aria-selected', 'true');
            hideNative();
            fields.category.focus();
        });

        async function search(query, skip) {
            controller?.abort();
            const request = new AbortController();
            controller = request;
            const timeout = setTimeout(() => request.abort(), 30000);
            form.querySelector('button').disabled = true;
            previous.disabled = next.disabled = true;
            results.replaceChildren();
            pagination.hidden = true;
            status.textContent = 'Searching…';
            try {
                const response = await fetch('/mycase/Search/SearchCases', {
                    method: 'POST', credentials: 'same-origin', signal: request.signal,
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
                    body: JSON.stringify({ ...query, Skip: skip })
                });
                if (!response.ok) throw new Error(`MyCase search failed (${response.status}). Try again or use the normal search.`);
                let body;
                try { body = await response.json(); }
                catch { throw new Error('MyCase did not return search data. Use the normal search to check for a verification prompt.'); }
                const page = api.parse(body);
                if (controller !== request || !active) return;
                savedQuery = query;
                currentSkip = skip;
                const table = document.createElement('table');
                table.className = 'table table-striped';
                table.innerHTML = '<caption class="sr-only">Recently filed cases</caption><thead><tr><th scope="col">Case number</th><th scope="col">Case name</th><th scope="col">Court</th><th scope="col">Type</th><th scope="col">Filed</th><th scope="col">Status</th></tr></thead>';
                const tbody = table.createTBody();
                for (const row of page.rows) {
                    const tr = tbody.insertRow();
                    const cell = tr.insertCell();
                    const url = api.caseUrl(row.caseToken);
                    const link = document.createElement(url ? 'a' : 'span');
                    link.className = 'recent-case-link';
                    link.textContent = row.number;
                    if (url) link.href = url;
                    else link.title = 'MyCase did not return a link for this case.';
                    cell.append(link);
                    for (const value of [row.title, row.court, row.type, row.filed, row.status]) tr.insertCell().textContent = String(value || '—');
                }
                if (page.rows.length) results.append(table);
                status.textContent = page.rows.length ? `${skip + 1}–${skip + page.rows.length}${page.total === null ? '' : ` of ${page.total}`} cases` : 'No cases found for this page and date range.';
                previous.disabled = skip === 0;
                next.disabled = page.total === null ? page.rows.length < query.Take : skip + page.rows.length >= page.total;
                pagination.hidden = !page.rows.length && skip === 0;
            } catch (error) {
                if (controller === request && active) status.textContent = request.signal.aborted ? 'Search stopped. Please try again.' : error.message;
            } finally {
                clearTimeout(timeout);
                if (controller === request) form.querySelector('button').disabled = false;
            }
        }
        form.addEventListener('submit', event => {
            event.preventDefault();
            updateDates();
            try {
                const query = api.payload({ category: fields.category.value, start: fields.start.value, end: fields.end.value, court: fields.court.value });
                void search(query, 0);
            } catch (error) { status.textContent = error.message; }
        });
        previous.addEventListener('click', () => search(savedQuery, Math.max(0, currentSkip - savedQuery.Take)));
        next.addEventListener('click', () => search(savedQuery, currentSkip + savedQuery.Take));
        tabs.append(tab);
        tabs.after(panel);
        return { tabs, refresh: hideNative, destroy() { close(); tabs.removeEventListener('click', nativeClick, true); tab.remove(); panel.remove(); } };
    }

    function sync() {
        const tabs = /^#\/vw\/Search(?:[/?]|$)/i.test(location.hash) ? document.getElementById('searchByTabs') : null;
        if (mounted && mounted.tabs !== tabs) { mounted.destroy(); mounted = null; }
        if (tabs && !mounted) mounted = mount(tabs);
        mounted?.refresh();
    }
    let scheduled = false;
    new MutationObserver(() => {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(() => { scheduled = false; sync(); });
    }).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', sync);
    sync();
})();
