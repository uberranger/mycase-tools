(function() {
    'use strict';

    window.addEventListener("load", () => {
        console.log("MyCase Tools Script Loaded!");

        const maxRefreshAttempts = 10;
        let docLinks = [];
        let expanded = false;
        
        const darkModeStyle = document.createElement('style');
        darkModeStyle.textContent = `@media (prefers-color-scheme: dark) {
            :root, html, body, footer, .footer, footer div, .footer div, .panel, .form-control, .nav-tabs>li>a, .nav-tabs>li>a:hover, .nav-tabs>li.active>a,
            .nav-tabs>li.active>a:hover, .navbar-inverse, nav.framework-header.navbar.navbar-inverse, div.nav-subrow, .alert-info, .btn-default, option {
                // color-scheme: dark;
                // background-color: unset;
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
            tr:hover, .table-hover>tbody>tr:hover {
                background-color: #252525;
            }
            .text-primary {
                color: lightblue;
            }
            .text-muted { 
                color: white;
            }
            .nav-tabs>li.active>a, .nav-tabs>li.active>a:hover {
                border-width: medium;
            }

            .panel-default>.panel-heading {
                background-color: white;
            }
        }`;
        document.head.appendChild(darkModeStyle);
        
        const buttonContainer = document.createElement("div");
        buttonContainer.id = "mycaseToolContainer"
        const downloadButton = document.createElement("button");
        const refreshButton = document.createElement("button");
        
        const containerStyle = {
            position: "fixed",
            top: "2vmax",
            left: "2vmax",
            //left: "0",
            zIndex: "9999",
            display: 'flex',
            gap: '1vmax',
            //outline: '1px solid dodgerblue',
            //padding: '.5vmax .5vmax .5vmax 2vmax',
        };

        const buttonStyle = {
            padding: ".5vmax",
            fontSize: "1.25rem",
            background: "dodgerblue",
            color: "white",
            border: "none",
            cursor: "pointer",
            "box-shadow": "10px 5px 5px rgb(23, 68, 91)",
        };

        Object.assign(buttonContainer.style, containerStyle);
        Object.assign(downloadButton.style, buttonStyle);
        Object.assign(refreshButton.style, buttonStyle);

        downloadButton.textContent = "No Documents Found";
        refreshButton.textContent = "Refresh";

        buttonContainer.appendChild(downloadButton);
        buttonContainer.appendChild(refreshButton);
        

        

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

        if (window.location.href.includes("vw/CaseSummary")) {
            document.body.appendChild(buttonContainer);
        } else if (document.getElementById("mycaseToolContainer")) {
            document.body.removeChild(buttonContainer);
        }

        downloadButton.addEventListener("click", downloadLinks);
        refreshButton.addEventListener("click", refreshDocLinks);

        let refreshAttempts = 0;
        let checkInterval = setInterval(checkDocLinks, 250);
    });
})();
