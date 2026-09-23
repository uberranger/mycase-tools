(function () {
    'use strict';

    console.log("MyCase Tools Script Loaded!");

    const maxRefreshAttempts = 10;
    // const clickDelay = 400;
    let docLinks = [];
    let expanded = false;

    const entryHighlightStyleMap = {
        "session": "session-highlight",
        "automated enotice": "enotice-highlight",
        "automated paper": "paper-highlight",
        "appearance filed": "appearance-highlight",
        "judicial officer": "judicial-highlight"
    };

    window.addEventListener("load", () => {
        const hasExpandTitle = (a) => a.getAttribute("title") && a.getAttribute("title").includes("Click to expand");

        const isMiddleLink = (a) => a.parentNode.className.includes("media-middle") && a.parentNode.className.includes("media-body");

        const toggleExpands = () => {
            const expandLinks = Array.from(document.querySelectorAll("a")).filter(a => hasExpandTitle(a) && isMiddleLink(a));
            if (expandLinks.length > 0) {
                expandLinks.forEach(link => link.click());
                expanded = !expanded;
            }
        }

        const getDocLinks = () => {
            if (!expanded) toggleExpands();

            if (checkInterval && refreshAttempts >= maxRefreshAttempts) {
                downloadButton.textContent = "No Documents Found";
                clearInterval(checkInterval);
                return;
            }
            refreshAttempts++;

            return Array.from(document.querySelectorAll("a")).filter(a => isMiddleLink(a) && !hasExpandTitle(a));
        }

        const refresh = () => {
            highlightRows();
            docLinks = [];
            refreshAttempts = 0;
            downloadButton.textContent = `Loading...`;
            // checkInterval = setInterval(checkDocLinks, 250);
            checkInterval = setInterval(() => {
                docLinks = getDocLinks(); if (docLinks.length > 0) {
                    downloadButton.textContent = `Download ${docLinks.length} Documents`;
                    clearInterval(checkInterval);

                } else {
                    downloadButton.textContent = `Loading...${((refreshAttempts / maxRefreshAttempts) * 100).toFixed(0)}%`;
                }
            }, 250);

        };

        const clickNextLink = () => {
            if (docLinks.length === 0) return;
            docLinks[0].click();
            // docLinks[0].link.click();
            docLinks.shift();
        }

        const startDownload = () => {
            console.info("beginning download.", docLinks.length, "files");

            if (docLinks.length === 0) refresh();
            chrome.runtime.sendMessage({ type: "courts-download-start" });

            clickNextLink();
        }

        const highlightRows = () => {
            document.querySelectorAll("tr").forEach(tr => {

                const trText = tr.textContent.toLowerCase();

                for (const [keyword, className] of Object.entries(entryHighlightStyleMap)) {
                    if (trText.includes(keyword)) {
                        tr.classList.add(className);
                        break;
                    }
                }
            });
        }

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg && msg.type === 'courts-download') clickNextLink();
        });

        const buttonContainer = document.createElement("div");
        const downloadButton = document.createElement("button");
        const refreshButton = document.createElement("button");

        if (window.location.href.includes("vw/CaseSummary")) {
            buttonContainer.id = "toolContainer"

            downloadButton.textContent = "No Documents Found";

            refreshButton.textContent = "Refresh";

            buttonContainer.appendChild(downloadButton);
            buttonContainer.appendChild(refreshButton);

            downloadButton.addEventListener("click", startDownload);
            refreshButton.addEventListener("click", refresh);

            document.body.appendChild(buttonContainer);
        } else if (document.getElementById("toolContainer")) {
            document.body.removeChild(buttonContainer);
        }

        let refreshAttempts = 0;
        let checkInterval = undefined;
        refresh();
    });
})();
