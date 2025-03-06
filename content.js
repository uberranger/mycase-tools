(function() {
    'use strict';

    // let dailyGoal = 6;
    // let weeklyGoal = 30;

    console.log("NetSuite Mod Loaded!");

    const darkModeStyle = document.createElement('style');
    darkModeStyle.textContent = `@media (prefers-color-scheme: dark) {
        #body, body[data-page-category='form'] #body, .texttable, .listtexthl, .input, input, input[type="text"]:not([id^="uif"]),
        textarea, input[type="text"]:disabled:not([id^="uif"]), .pgBntG, .uir-button .pgBntG .bntBgB, .uir-button .pgBntG .bntBgB input[type=button],
        #popup_outerdiv div.uir-filter-area, .nltabcontent, .uir-machine-table-container, .uir-machine-row>td, .uir-list-body, .uir-list-body-wrapper,
        .uir-list-row-odd>td {
            background: black !important;
            background-color: black;
            color: white !important;
        }
        span.uir-label .smallgraytextnolink, .ns-portlet-wrapper div .ns-portlet-header-text, #uir-total-count, .uir-list-filter-bar .smalltextnolink * {
            color: white !important;
        }
        .inputreadonly, input[type="text"]:disabled:not([id^="uif"]) {
            color: lightgrey !important;        
        }
        .uir-page-title-record .uir-record-type {
            color: lightcyan;
        }
        a, .dottedlink, .ns-portlet-wrapper[data-portlet-type="calendar"] .ns-title-primary, .uir-list-row-tr .dottedlink, .uir-header-buttons, .uir-button-menu>.ns-menu a {
            color: skyblue !important;
        }
        
        td.fgroup_title, div.fgroup_title, div.bgsubtabbar, div.bgsubtabbar, .listheader, body[data-header="refreshed"] #div__header, .listtexthlbold, 
        .uir-page-title-record .uir-record-status, .ns-portlet-wrapper, .ns-message-component, .ns-ec-tile, #inner_popup_div table tr td,
        .listtable>tbody>tr:not(.uir-machine-row-last):not(.uir-machine-row-focused)>td, .uir-list-row-even>td, .uir-list-top-button-bar, .uir-list-header-td,
        .uir-filters-header, .page-title-menu .ns-menu {
            background: #222 !important;
            // outline: 1px solid deepskyblue;
            color: white !important;
        }
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td.ns-significant-day,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td {
            background: black;
        }

        .ns-dashboard-column .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view .ns-today, tr.uir-list-row-tr:hover td {
            background: dimgrey !important;
        }

        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td .ns-event-view .ns-event-content,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td.ns-significant-day .ns-event-view .ns-event-content,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-event-view.ns-event-view[data-event-type='event'][data-response-status='noresponse'],
        .uir-tooltip, #popup_outerdiv div {
            // background: black;
            background: #222 !important;
            // outline: 1px solid deepskyblue;
        }

        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-daily-view tr:hover td, 
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-daily-view tr:hover th, 
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-weekly-view tr:hover td, 
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-weekly-view tr:hover .ns-day-info.ns-today, 
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td:hover, 
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td.ns-significant-day:hover,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td:hover .ns-event-view .ns-event-content,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td.ns-significant-day:hover .ns-event-view .ns-event-content,
        .ns-portlet-wrapper[data-portlet-type='calendar'] .ns-monthly-view td:hover .ns-event-view .ns-event-content,
        .uir-machine-headerrow>td,
        uir-select-input-container uir-field-popup-wrapper, .listcontrol input[type="text"]:focus {
            background: black !important;
            outline: 3px solid deepskyblue;
        }
    }`;

    const timeContainerStyle = document.createElement('style');
    timeContainerStyle.textContent = `
        #modifiedTimeLabel {
            position: fixed;
            top: .5vmax;
            left: 50%;
            transform: translate(-50%, 0);
            zIndex: 9999;
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
    document.head.appendChild(timeContainerStyle);

    const timeStringToNumber = (timeString) => {
        const timeParts = timeString.split(":");
        const hours = +timeParts[0];
        const minutes = (Math.round(+timeParts[1] / 60 * 10) / 10);
        return !isNaN(hours + minutes) ? hours + minutes : 0;
    }    

    const updateTimeLabel = (timeContainer) => {
        const table = document.getElementById("timesheet_splits");
        const times = Array.from(table.rows[table.rows.length - 1].children).map(c => timeStringToNumber(c.innerText)).filter(t => t > 0);

        const timeBilled = times[times.length - 2];
        const totalBilled = times[times.length - 1];
        
        const now = new Date();
        const todayHours = now.getHours() - 9;
        const todayMinutes = Math.trunc((now.getMinutes() / 6)) / 10;
        
        let timeElapsed = todayHours + todayMinutes;
        timeElapsed = timeElapsed > 0 ? timeElapsed : 0;

        while (timeContainer.firstChild) {timeContainer.removeChild(timeContainer.firstChild);}

        const timeHeader = document.createElement("h1");
        timeContainer.appendChild(timeHeader)
        timeHeader.textContent = `${timeBilled} Billed Today`;

        const labelText = [
            ["Billing Efficiency", timeBilled, timeElapsed, timeBilled / (timeElapsed > 0 ? timeElapsed : 1)],
            ["Daily Goal", timeBilled, 6, timeBilled / 6],
            ["Weekly Goal", totalBilled, 30, totalBilled / 30]
        ]

        labelText.forEach(t => {
            const l = document.createElement("label");
            const title = document.createElement("p");
            const current = document.createElement("p");
            const of = document.createElement("p");
            const goal = document.createElement("p");
            const percent = document.createElement("p");

            timeContainer.appendChild(l);
            l.appendChild(title);
            l.appendChild(current);
            l.appendChild(of);
            l.appendChild(goal);
            l.appendChild(percent);

            title.textContent = t[0]
            current.textContent = t[1];
            of.textContent = "of";
            goal.textContent = t[2];
            percent.textContent = `${(t[3] * 100).toFixed(0)}%`;
        })
    }

    window.addEventListener("load", () => {
        if (window.location.href.includes("timebill.nl")) {
            const timeContainer = document.createElement("div");
            timeContainer.id = "modifiedTimeLabel"
                        
            document.body.appendChild(timeContainer);
            
            updateTimeLabel(timeContainer)
            setInterval(() => updateTimeLabel(timeContainer), 30000);
        } else if (document.getElementById("modifiedTimeLabel")) {
            document.body.removeChild(document.getElementById("modifiedTimeLabel"));
        }
    });
})();
