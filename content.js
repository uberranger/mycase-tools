(function () {
    'use strict';

    console.log("MyCase Tools Script Loaded!");

    const maxRefreshAttempts = 10;
    let docLinks = [];
    let expanded = false;

    const entryHighlightStyleMap = {
        "session": "20px solid goldenrod",
        "automated enotice": "5px solid saddlebrown",
        "automated paper": "5px solid midnightblue",
        "appearance filed": "10px solid indigo",
        "judicial officer": "20px solid green"
    };

    window.addEventListener("load", () => {
        const darkModeStyle = document.createElement("style");
        darkModeStyle.textContent = `@media (prefers-color-scheme: dark) {
    :root, html, body {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }

    /* Header and navigation */
    .framework-header,
    .navbar,
    .navbar-inverse,
    .nav-subrow {
        background-color: #2a2a2a !important;
        color: #f0f0f0;
        border-color: #444;
    }

    .navbar-nav > li > a,
    .navbar-nav > li > a:hover,
    .navbar-brand {
        color: #f0f0f0 !important;
    }

    /* Tabs */
    .nav-tabs > li > a {
        background-color: #2c2c2c;
        border-color: #444 #444 transparent #444;
        color: #ddd;
    }

    .nav-tabs > li > a:hover {
        background-color: #3a3a3a;
        border-color: #555 #555 transparent #555;
    }

    .nav-tabs > li.active > a,
    .nav-tabs > li.active > a:hover {
        background-color: #1e1e1e;
        color: #fff;
        border: 1px solid #666;
        border-bottom-color: transparent;
    }

    /* Buttons */
    .btn-default {
        background-color: #2c2c2c;
        color: #e0e0e0;
        border: 1px solid #555;
    }

    .btn-primary,
    .btn-primary:hover {
        background-color: #4dabf7;
        color: #fff;
        border: none;
    }

    /* Panels */
    .panel,
    .panel-default {
        background-color: #262626;
        border-color: #444;
        color: #e0e0e0;
    }

    .panel-default > .panel-heading {
        background-color: #333;
        color: #fff;
    }

    /* Alerts */
    .alert-info {
        background-color: #29323c;
        border-color: #3a4a5a;
        color: #d9edf7;
    }

    /* Modals */
    .modal-content,
    .modal-header,
    .modal-footer {
        background-color: rgba(30, 30, 30, 0.95);
        color: #f5f5f5;
        border-color: #444;
    }

    /* Form controls */
    .form-control,
    select,
    option,
    input,
    textarea {
        background-color: #1f1f1f;
        color: #e0e0e0;
        border: 1px solid #555;
    }

    /* Tables */
    .table-striped > tbody > tr:nth-of-type(odd),
    table.results tr:nth-of-type(odd) {
        background-color: #252525;
    }

    .table-hover > tbody > tr:hover,
    table.results tr:hover {
        background-color: #333;
    }

    table.results .result-col-left,
    table.results .result-col-middle,
    table.results .result-col-right {
        border-color: #444;
        background-color: #202020;
    }

    table.results .result-title {
        color: #8ab4f8;
    }

    table.results .result-title:hover {
        color: #ff7e6b;
    }

    table.results .result-subtitle {
        color: #a0a0a0;
    }

    /* Utility text */
    .text-primary {
        color: #8ab4f8 !important;
    }

    .text-muted,
    .ccs-parties td.ccs-party-c2,
    .ccs-charges td.ccs-charge-c2,
    .ccs-bonds td.ccs-bond-c2 {
        color: #a0a0a0 !important;
    }

    /* Footer - fixed bright areas */
    footer, .footer,
    footer div, .footer div {
        background-color: #1a1a1a !important;
        background-image: none !important;
        background: none !important;
        box-shadow: none !important;
        color: #ccc !important;
    }

    footer::before,
    footer::after,
    .footer::before,
    .footer::after {
        background: none !important;
        background-image: none !important;
        box-shadow: none !important;
        content: none !important;
    }

    .media-left .icon32 {
        filter: brightness(0.8) contrast(1.1);
    }

    /* Disabled text and links */
    a.disabled,
    .btn.disabled,
    .ccs a.disabled,
    .result-toolbar .btn.disabled,
    .result-toolbar .btn:disabled {
        color: #555 !important;
    }
}
`;

        const toolContainerStyle = document.createElement("style");
        toolContainerStyle.textContent = `
        #toolContainer {
    position: fixed;
    top: 30%;
    right: 0;
    background: rgba(30, 30, 30, 0.75); /* soft dark gray */
    backdrop-filter: blur(12px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem 0 0 0.5rem;
    padding: 1vmax 2vmax 1vmax 1vmax;
    z-index: 9999;
    display: flex;
    gap: 1vmax;
    box-shadow: -4px 0 12px rgba(0, 0, 0, 0.4);
}

#toolContainer > * {
    padding: 0.6vmax 1vmax;
    font-size: 1.1rem;
    background: rgba(45, 45, 45, 0.85); /* deeper gray for contrast */
    border: 1px solid rgba(77, 170, 247, 0.4); /* soft blue edge */
    border-radius: 0.4rem;
    color: #e0f0ff;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease;
}

#toolContainer > *:hover {
    background: rgba(70, 70, 70, 0.85);
    transform: translateY(-2px);
}
`;

        document.head.appendChild(darkModeStyle);
        document.head.appendChild(toolContainerStyle);

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

                for (const [keyword, border] of Object.entries(entryHighlightStyleMap)) {
                    if (trText.includes(keyword)) {
                        tr.style.borderLeft = border;
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
