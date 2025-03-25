(function () {
    'use strict';

    console.log("MyCase Tools Script Loaded!");

    const maxRefreshAttempts = 10;
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

        const checkDocLinks = () => {
            highlightRows();

            if (refreshAttempts >= maxRefreshAttempts) {
                downloadButton.textContent = "No Documents Found";
                clearInterval(checkInterval);
                return;
            }

            if (!expanded) toggleExpands();
            docLinks = Array.from(document.querySelectorAll("a")).filter(a => isMiddleLink(a) && !hasExpandTitle(a));
            refreshAttempts++;

            if (docLinks.length > 0) {
                downloadButton.textContent = `Download ${docLinks.length} Documents`;
                clearInterval(checkInterval);

            } else {
                downloadButton.textContent = `Waiting for CCS...${((refreshAttempts / maxRefreshAttempts) * 100).toFixed(0)}%`;
            }
        };

        const refreshDocLinks = () => {
            toggleExpands();
            docLinks = [];
            refreshAttempts = 0;
            downloadButton.textContent = `Waiting for CCS...`;
            checkInterval = setInterval(checkDocLinks, 250);
        };

        const downloadLinks = () => {
            console.info("beginning download.", docLinks.length, "files");
            // let count = 0;
            docLinks.forEach((a, i) => {
                setTimeout(() => {
                    a.click();
                    // count++;
                    // console.info(count, ". clicked",a.getAttribute("title"))
                }, i * 100);
            });
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

        const buttonContainer = document.createElement("div");
        const downloadButton = document.createElement("button");
        const refreshButton = document.createElement("button");

        if (window.location.href.includes("vw/CaseSummary")) {
            buttonContainer.id = "toolContainer"

            downloadButton.textContent = "No Documents Found";

            refreshButton.textContent = "Refresh";

            buttonContainer.appendChild(downloadButton);
            buttonContainer.appendChild(refreshButton);

            downloadButton.addEventListener("click", downloadLinks);
            refreshButton.addEventListener("click", refreshDocLinks);

            document.body.appendChild(buttonContainer);
        } else if (document.getElementById("toolContainer")) {
            document.body.removeChild(buttonContainer);
        }

        let refreshAttempts = 0;
        let checkInterval = setInterval(checkDocLinks, 250);
    });
})();
