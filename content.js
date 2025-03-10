(function() {
    'use strict';

    // let dailyGoal = 6;
    // let weeklyGoal = 30;

    console.log("NetSuite Mod Loaded!");

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
            :root, html, body, footer, .footer, footer div, .footer div, .panel, .form-control, .nav-tabs>li>a, .nav-tabs>li>a:hover, .nav-tabs>li.active>a,
            .nav-tabs>li.active>a:hover, .navbar-inverse, nav.framework-header.navbar.navbar-inverse, div.nav-subrow, .alert-info, .btn-default, option {
                background: unset;
                background-color:black;
                color: white;
            }
            div.nav-subrow {
                background: unset !important;
            }
            .table-striped>tbody>tr:nth-of-type(odd) {
                background-color: unset;
            }
            .modal-content, .modal-content .modal-header, .modal-content .modal-footer {
                background-color: rgba(0, 0, 0, .8);
            }
            a {
                color: deepskyblue;
            }
            .btn-primary, .btn-primary:hover {
                background-color: deepskyblue;
            }
            tr:hover, .table-hover>tbody>tr:hover, .panel-default>.panel-heading {
                background-color: #222;
                color: white;
            }
            .text-primary {
                color: lightblue;
            }
            .text-muted { 
                color: lightgrey;
            }
            .nav-tabs>li.active>a, .nav-tabs>li.active>a:hover {
                border-width: medium;
            }
            .list-group-item, .list-group-item-info {
                background-color: black !important;
                outline: 1px solid deepskyblue;
                color: deepskyblue;
            }            
        }
        @media (min-width: 1200px) {
            .container {
                width: 80%;
            }
        }`;

        const toolContainerStyle = document.createElement("style");
        toolContainerStyle.textContent = `
        #toolContainer {
            position: fixed;
            top: 30%;
            right: 0;
            // background: rgba(100, 100, 100, 0.75);
            backdrop-filter: blur(10px);
            // outline: 2px solid white;
            padding: 1vmax 2vmax 1vmax 1vmax;
            z-index: 9999;
            display: flex;
            gap: 1vmax;
        }
        
        #toolContainer > * {
            padding: .5vmax;
            background: rgba(0, 0, 0, .5);
            outline: 1px solid dodgerblue;
            color: white;
            border: none;
            display: grid;
            justify-items: center;
        }

        #modifiedTimeLabel > label {
            display: grid;
            grid-template-columns: 8fr 4fr 1fr 4fr 4fr;
            gap: 1vmax;
            justify-items: start;
            width: 100%;
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
