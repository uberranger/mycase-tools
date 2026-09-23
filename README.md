# MyCase Tools

Chrome extension with dark mode, document tools, and recent filing search for Indiana MyCase.

Load this folder with **Load unpacked** at `chrome://extensions` (enable Developer mode). After an update, reload the extension and refresh MyCase.

At `https://public.courts.in.gov/mycase/#/vw/Search`, select **Recent**, choose a category, court, and filing date range, then select **Search recent cases**. Results show newest filings first, 20 per page. Select a case number to open its case summary directly. Links also support opening in a new tab.

Search uses MyCase's `/mycase/Search/SearchCases` endpoint and the same category/date fields as LPM's MyCase search tool. Appellate and Commercial use `Limits`; other categories use `Categories`. Requests use the current browser session. If MyCase asks for verification, complete it through the normal search before retrying.

The manifest matches `/mycase/*` because Chrome match patterns do not include URL fragments. The script mounts only on the Search route and handles in-page navigation.

Run checks with `node --test tests/recent-search.test.js`.
