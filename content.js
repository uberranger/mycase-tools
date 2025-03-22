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
    :root, html, body, footer, .footer, footer div, .footer div, .panel, .form-control, 
    .nav-tabs>li>a, .nav-tabs>li>a:hover, .nav-tabs>li.active>a, .nav-tabs>li.active>a:hover, 
    .navbar-inverse, nav.framework-header.navbar.navbar-inverse, div.nav-subrow, 
    .alert-info, .btn-default, option {
        background-color: #1e1e1e;
        color: #e0e0e0;
    }

    div.nav-subrow {
        background-color: #2a2a2a !important;
    }

    .table-striped>tbody>tr:nth-of-type(odd) {
        background-color: #2b2b2b;
    }

    .modal-content, .modal-content .modal-header, .modal-content .modal-footer {
        background-color: #2c2c2c;
    }

    a {
        color: #4dabf7;
    }

    .btn-primary, .btn-primary:hover {
        background-color: #4dabf7;
        color: #fff;
        border: none;
    }

    tr:hover, .table-hover>tbody>tr:hover, .panel-default>.panel-heading {
        background-color: #333;
        color: #f0f0f0;
    }

    .text-primary {
        color: #8ab4f8;
    }

    .text-muted { 
        color: #b0b0b0;
    }

    .nav-tabs>li.active>a, .nav-tabs>li.active>a:hover {
        border-width: medium;
        background-color: #2e2e2e;
    }

    .list-group-item, .list-group-item-info {
        background-color: #1f1f1f !important;
        border: 1px solid #4dabf7;
        color: #cfd8dc;
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
