import * as d3 from "d3";
import { IAdminAnalyticsData, IReflectionAuthor, AdminAnalyticsData, IDataStats, IAdminAnalyticsDataStats, AdminAnalyticsDataStats } from "./data/data.js";
import { IAdminAnalyticsDataRaw, AdminAnalyticsDataRaw } from "./data/db.js";

/* ------------------------------------------------
    Start data interfaces and classes 
-------------------------------------------------- */



/* ------------------------------------------------
    End data interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of charts interfaces and classes
-------------------------------------------------- */

// Basic interface for chart scales




// Basic interface for chart elements (includes zoom)


// Interface for timeline data


// Basic interface for Html containers


/* ------------------------------------------------
    End of charts interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin control interfaces and classes 
-------------------------------------------------- */





/* ------------------------------------------------
    End of admin control interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of admin experimental interfaces and classes 
-------------------------------------------------- */





/* ------------------------------------------------
    End of admin experimental interfaces and classes 
-------------------------------------------------- */

/* ------------------------------------------------
    Start of author control interfaces and classes 
-------------------------------------------------- */









/* ------------------------------------------------
    End of author control interfaces and classes 
-------------------------------------------------- */


/* ------------------------------------------------
    Start of author experimental interfaces and classes 
-------------------------------------------------- */





/* ------------------------------------------------
    End of author experimental interfaces and classes 
-------------------------------------------------- */


/* ------------------------------------------------
    Start utils interfaces and classes 
-------------------------------------------------- */

// Loading interfaces and classes
interface ILoading {
    isLoading: boolean;
    spinner: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    appendDiv():  d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    removeDiv(): void;
}

class Loading implements ILoading {
    isLoading: boolean;
    spinner: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    constructor() {
        this.isLoading = true;
        this.spinner = this.appendDiv();

    }
    appendDiv():  d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        let div = d3.select(".wrapper")
            .append("div")
            .attr("class", "loader")
        div.append("div")
            .attr("class", "loader-inner")
            .selectAll(".loader-line-wrap")
            .data([1, 2, 3, 4, 5])
            .enter()
            .append("div")
            .attr("class", "loader-line-wrap")
            .append("div")
            .attr("class", "loader-line");
        return div;
    }
    removeDiv(): void {
        this.spinner.remove();
    }
}

// Tutorial interfaces and classes
interface ITutorialData {
    id: string;
    content: string;
}

class TutorialData implements ITutorialData {
    id: string;
    content: string;
    constructor(id: string, content: string) {
        this.id = id;
        this.content = content;
    }
}

interface ITutorial {
    tutorial: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    tutorialData: ITutorialData[];
    slide: number;
    appendTutorial(id: string): d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    removeTutorial(): void;
}

class Tutorial implements ITutorial {
    tutorial: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    tutorialData: ITutorialData[];
    slide: number;
    constructor(data: ITutorialData[]) {
        this.tutorial = this.appendTutorial();
        this.tutorialData = data;
        this.slide = 0;
        this.appendTutorialBackdrop();
    }
    appendTutorial(): d3.Selection<HTMLDivElement, unknown, HTMLElement, any> {
        d3.select("body")
            .classed("no-overflow", true);
        let div = d3.select(".wrapper")
            .append("div")
            .attr("class", "tutorial");
        return div;
    };
    private appendTutorialBackdrop(): void {
        if (this.slide >= this.tutorialData.length) {
            this.removeTutorial();
            return;
        }
        window.scroll(0, 0);
        let tutorialData = this.tutorialData[this.slide];
        let tutorialFocus = d3.select<HTMLDivElement, unknown>(tutorialData.id).node().getBoundingClientRect();
        class TutorialContentData {
            top: string;
            left: string;
            width: string;
            height: string;
            constructor(top: string, left: string, width: string, height: string) {
                this.top = top;
                this.left = left;
                this.width = width;
                this.height = height;
            }
        }
        window.scroll(0, tutorialFocus.top - 200);
        let data = [new TutorialContentData("0px", "0px", "100%", tutorialFocus.top + "px"), 
            new TutorialContentData(tutorialFocus.bottom + "px", "0px", "100%", "100%"), 
            new TutorialContentData(tutorialFocus.top + "px", "0px", tutorialFocus.left + "px", tutorialFocus.height + "px"), 
            new TutorialContentData(tutorialFocus.top + "px", tutorialFocus.right + "px", "100%", tutorialFocus.height + "px")]
        this.tutorial.selectAll(".tutorial-backdrop")
            .data(data)
            .join(
                enter => enter.append("div")
                    .attr("class", "tutorial-backdrop")
                    .style("top", d => d.top )
                    .style("left", d => d.left)
                    .style("width", d => d.width)
                    .style("height", d => d.height),
                update => update.style("top", d => d.top )
                    .style("left", d => d.left)
                    .style("width", d => d.width)
                    .style("height", d => d.height),
                exit => exit.remove()
            );
        
        this.appendTutorialContent(tutorialFocus, tutorialData.content);
    };
    private appendTutorialContent(tutorialFocus: DOMRect, content: string) {
        let isLeft = true;
        if (tutorialFocus.left + 50 > window.innerWidth / 2) {
            isLeft = false;
        }
        if (this.tutorial.selectAll(".tutorial-content").empty()) {
            this.tutorial.append("div")
                .attr("class", "tutorial-content")
                .style("top", (tutorialFocus.top - 50) + "px")
                .style("left", tutorialFocus.left + tutorialFocus.width + 50 + "px")
                .call(div => div.append("div")
                    .attr("class", "row")
                    .call(div => div.append("div")
                        .attr("class", "col-md-12")
                        .html(content))
                    .call(div => div.append("div")
                        .attr("class", "col-md-6"))
                    .call(div => div.append("div")
                        .attr("class", "col-md-5 d-flex")
                        .call(div => div.append("button")
                            .attr("class", "btn btn-success d-block w-50")
                            .html("Next")
                            .on("click", () => { this.slide = this.slide + 1; this.appendTutorialBackdrop() }))
                        .call(div => div.append("button")
                            .attr("class", "btn btn-warning d-block w-50")
                            .html("Skip")
                        .on("click", () => this.removeTutorial()))));
            if (!isLeft) {
                this.tutorial.select<HTMLDivElement>(".tutorial-content")
                    .style("left", tutorialFocus.left - this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().width - 50 + "px");
            }
            this.drawArrow(tutorialFocus, isLeft);
        } else {
            this.tutorial.select<HTMLDivElement>(".tutorial-content")
                .style("top", (tutorialFocus.top - 50) + "px")
                .style("left", isLeft ? tutorialFocus.left + tutorialFocus.width + 50 + "px" : 
                    tutorialFocus.left - this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().width - 50 + "px");
            this.tutorial.select(".col-md-12")
                .html(content);
            this.tutorial.select(".tutorial-arrow").remove();
            this.drawArrow(tutorialFocus, isLeft);
        }
    };
    private drawArrow(tutorialFocus: DOMRect, isLeft: boolean): void {
        let tutorialArrow = this.tutorial.append("div")
            .attr("class", "tutorial-arrow")
            .style("top", (tutorialFocus.top - 50) + "px")
            .style("left", isLeft ? tutorialFocus.left + (tutorialFocus.width / 4) + "px" :
                this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().left + this.tutorial.select<HTMLDivElement>(".tutorial-content").node().getBoundingClientRect().width + "px")
            .style("width", (tutorialFocus.width / 4 * 3) + 50 + "px")
            .style("height", "50px");
        let svg = tutorialArrow.append("svg")
            .attr("viewBox", `0 0 ${tutorialArrow.node().getBoundingClientRect().width} ${tutorialArrow.node().getBoundingClientRect().height}`)
        svg.append("defs")
            .append("marker")
            .attr("id", "arrow-head")
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("refX", 2)
            .attr("refY", 2)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L0,4 L4,2 L0,0")
            .attr("class", "arrow-head");
        let xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, tutorialArrow.node().getBoundingClientRect().width]);
        let yScale = d3.scaleLinear()
            .domain([100, 0])
            .range([0, tutorialArrow.node().getBoundingClientRect().height]);
        let pathGenerator = d3.line<{x: number, y: number}>()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y))
            .curve(d3.curveCatmullRom);
        svg.append("path")
            .attr("d", isLeft ? pathGenerator([{x: 95, y: 80}, {x: 25, y: 70}, {x: 25, y:25}]) : pathGenerator([{x: 0, y: 80}, {x: 75, y: 70}, {x: 75, y: 25}]))
            .attr("class", "arrow")
            .attr("marker-end", "url(#arrow-head)");
        
    };
    removeTutorial(): void {
        d3.select("body")
            .classed("no-overflow", false);
        this.tutorial.remove();
    };
}

/* ------------------------------------------------
    End utils interfaces and classes 
-------------------------------------------------- */

export async function buildControlAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]) {
    let loading = new Loading();
    let rawData = entriesRaw.map(d => new AdminAnalyticsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map(d => new AdminAnalyticsData(d.group, d.value, d.creteDate, colourScale(d.group), d.selected));
    await drawCharts(entries);
    new Tutorial([ new TutorialData("#groups", "All your groups are selected to visualise and colours assigned. You cannot change this section"),
    new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#users .bar", "Hover for information on demand"), 
    new TutorialData("#histogram .histogram-rect", "Hover for information on demand"),
    new TutorialData("#timeline-plot", "Swap chart types. Both charts have zoom available")]);
    loading.isLoading = false;
    loading.removeDiv();
    async function drawCharts(allEntries: IAdminAnalyticsData[]) {
        let adminControlCharts = new AdminControlCharts();
        //Handle sidebar button
        adminControlCharts.sidebarBtn();
        adminControlCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = allEntries.map(d => new AdminAnalyticsDataStats(d));

        //Render totals
        adminControlCharts.renderTotals(data);

        //Create groups chart with current data
        let usersChart = new ChartSeries("users", data.map(d => d.group), false, data.map(d => d.getStat("usersTotal").value as number));
        adminControlCharts.renderBarChart(usersChart, data);
        d3.select("#users .card-subtitle")
            .html("");

        //Handle groups chart help
        d3.select("#users .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${usersChart.id}-help`, "<b>Bar chart</b><br>A bar chart of the users in each group code");
                adminControlCharts.help.helpPopover(usersChart.elements.contentContainer.select(".bar"), `${usersChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

         //Draw users histogram container
         let usersData = data.map(d => d.getUsersData());
         let histogram = new HistogramChartSeries("histogram", data.map(d => d.group));
         adminControlCharts.renderHistogram(histogram, usersData);
 
         //Handle users histogram chart help
         d3.select("#histogram .card-title button")
             .on("click", function (e: Event) {
                 adminControlCharts.help.helpPopover(d3.select(this), `${histogram.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i>");
                 adminControlCharts.help.helpPopover(histogram.elements.contentContainer.select(`#${histogram.id}-data`), `${histogram.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
             });

        //Draw timeline 
        let timelineChart = new ChartTime("timeline", [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        let timelineZoomChart = new ChartTimeZoom(timelineChart, [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminControlCharts.renderTimelineScatter(timelineChart, timelineZoomChart, data);
        adminControlCharts.handleTimelineButtons(timelineChart, timelineZoomChart, data);

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), `${timelineChart.id}-help`, "<b>Density plot</b><br>A density plot shows the distribution of a numeric variable<br><b>Scatter plot</b><br>The data is showed as a collection of points<br>The data represented are <i>reflections over time</i>");
                adminControlCharts.help.helpPopover(d3.select("#timeline #timeline-plot"), `${timelineChart.id}-help-button`, "<u><i>click</i></u> me to change chart type");
                adminControlCharts.help.helpPopover(d3.select("#timeline .zoom-rect.active"), `${timelineChart.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                if (!timelineChart.elements.contentContainer.select(".circle").empty()) {
                    let showDataHelp = adminControlCharts.help.helpPopover(timelineChart.elements.contentContainer.select(".circle"), `${timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
                    if (showDataHelp) {
                        d3.select(`#${timelineChart.id}-help-data`).style("top", parseInt(d3.select(`#${timelineChart.id}-help-data`).style("top")) - 14 + "px");
                    }
                }
            });

        //Draw user statistics
        let userStatistics = d3.select("#reflections .card-body");
        userStatistics.append("ul")
            .attr("class", "nav nav-tabs")
            .selectAll("li")
            .data(data)
            .enter()
            .append("li")
            .attr("class", "nav-item")
            .append("a")
            .attr("class", (d, i) => `nav-link ${i == 0 ? "active" : ""}`)
            .attr("href", d => `#reflections-${d.group}`)
            .attr("data-toggle", "tab")
            .html(d => d.group)
            .on("click", (e, d) => setTimeout(() => adminControlCharts.renderUserStatistics(d3.select(`#reflections-${d.group}`), d, [30, 70]), 250));
        let users = userStatistics.append("div")
            .attr("class", "tab-content")          
            .selectAll("div")
            .data(data)
            .enter()
            .append("div")
            .attr("class", (d, i) => `tab-pane fade ${i == 0 ? "show active" : ""} users-tab-pane`)
            .attr("id", d => `reflections-${d.group}`);
        users.each((d, i, g) => i == 0 ? adminControlCharts.renderUserStatistics(d3.select(g[i]), d, [30, 70]) : "");

        //Handle users histogram chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                adminControlCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Each user's reflections are shown sorted by time. The chart depicts the percentage of reflections in each reflection point group");
            });
    }
}

export async function buildExperimentAdminAnalyticsCharts(entriesRaw: IAdminAnalyticsDataRaw[]) {
    let loading = new Loading();
    let rawData = entriesRaw.map(d => new AdminAnalyticsDataRaw(d.group, d.value, d.createDate));
    let entries = rawData.map(d => d.transformData());
    let colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    entries = entries.map(d => new AdminAnalyticsData(d.group, d.value, d.creteDate, colourScale(d.group), true));
    await drawCharts(entries);
    new Tutorial([new TutorialData("#groups", "Add groups to the charts and change their colours"),
    new TutorialData(".card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#groups-chart .bar", "Hover for information on demand or click to compare and drill-down. Other charts will show only the selected group"), 
    new TutorialData("#group-histogram-chart .threshold-line", "Drag to change the threshold (soaring or distressed) and recalculate the bins"), 
    new TutorialData("#group-histogram-chart .histogram-rect", "Click to compare the bin with other's group bins"),
    new TutorialData("#timeline-plot", "Swap chart types. Both charts have zoom available"),
    new TutorialData("#timeline .circle", "Hover for information on demand or click to connect the user's reflections")]);
    loading.isLoading = false;
    loading.removeDiv();
    async function drawCharts(allEntries: IAdminAnalyticsData[]) {
        let adminExperimentalCharts = new AdminExperimentalCharts();
        //Handle sidebar button
        adminExperimentalCharts.sidebarBtn();

        //Preloaded groups
        let entries = adminExperimentalCharts.preloadGroups(allEntries);

        //Create data with current entries
        let data = entries.map(d => new AdminAnalyticsDataStats(d));

        //Render totals
        adminExperimentalCharts.renderTotals(data);

        //Create group chart with current data
        adminExperimentalCharts.barChart = new ChartSeries("users", data.map(d => d.group), false, data.map(d => d.getStat("usersTotal").value as number));
        adminExperimentalCharts.barChart = adminExperimentalCharts.renderBarChart(adminExperimentalCharts.barChart, data);

         //Handle groups chart help
         d3.select("#users .card-title button")
         .on("click", function (e: Event) {
            adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.barChart.id}-help`, "<b>Bar chart</b><br>A bar chart of the users in each group code");
            adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.barChart.elements.contentContainer.select(`#${adminExperimentalCharts.barChart.id}-data`), `${adminExperimentalCharts.barChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to compare and drill-down");
         });

         //Draw users histogram container
        let usersData = data.map(d => d.getUsersData());
        adminExperimentalCharts.histogram = new HistogramChartSeries("histogram", data.map(d => d.group));
        adminExperimentalCharts.renderHistogram(adminExperimentalCharts.histogram, usersData);

        //Handle users histogram chart help
        d3.select("#histogram .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.histogram.id}-help`, "<b>Histogram</b><br>A histogram group data points into user-specific ranges. The data points in this histogram are <i>users average reflection point</i>");
                adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.histogram.elements.contentContainer.select(".histogram-rect"), `${adminExperimentalCharts.histogram.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to compare");
                let showDragHelp = adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.histogram.elements.contentContainer.select(".threshold-line.soaring"), `${adminExperimentalCharts.histogram.id}-help-drag`, "<u><i>drag</i></u> me to change the thresholds");
                if (showDragHelp) {
                    d3.select(`#${adminExperimentalCharts.histogram.id}-help-drag`).style("top", parseInt(d3.select(`#${adminExperimentalCharts.histogram.id}-help-drag`).style("top")) - 19 + "px");
                }
            });

        //Draw timeline 
        adminExperimentalCharts.timeline = new ChartTime("timeline", [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminExperimentalCharts.timelineZoom = new ChartTimeZoom(adminExperimentalCharts.timeline, [d3.min(data.map(d => d.getStat("oldRef").value)) as Date, d3.max(data.map(d => d.getStat("newRef").value)) as Date]);
        adminExperimentalCharts.renderTimelineScatter(adminExperimentalCharts.timeline, adminExperimentalCharts.timelineZoom, data);
        adminExperimentalCharts.handleTimelineButtons(adminExperimentalCharts.timeline, adminExperimentalCharts.timelineZoom, data);

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select("#timeline #timeline-plot"), `${adminExperimentalCharts.timeline.id}-help-button`, "<u><i>click</i></u> me to change chart type");
                adminExperimentalCharts.help.helpPopover(d3.select("#timeline .zoom-rect.active"), `${adminExperimentalCharts.timeline.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                if (!adminExperimentalCharts.timeline.elements.contentContainer.select(".circle").empty()) {
                    adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.timeline.id}-help`, "<b>Scatter plot</b><br>A scatter plot shows the data as a collection of points<br>The data represented are <i>reflections over time</i>");
                    let showDataHelp = adminExperimentalCharts.help.helpPopover(adminExperimentalCharts.timeline.elements.contentContainer.select(".circle"), `${adminExperimentalCharts.timeline.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>click</i></u> me to connect the user's reflections");
                    if (showDataHelp) {
                        d3.select(`#${adminExperimentalCharts.timeline.id}-help-data`).style("top", parseInt(d3.select(`#${adminExperimentalCharts.timeline.id}-help-data`).style("top")) - 14 + "px");
                    }
                } else {
                    adminExperimentalCharts.help.helpPopover(d3.select(this), `${adminExperimentalCharts.timeline.id}-help`, "<b>Density plot</b><br>A density plot shows the distribution of a numeric variable<br>The data represented are <i>reflections over time</i>");
                }
            });

        //Draw user statistics
        let userStatistics = d3.select("#reflections .card");
        userStatistics.select(".card-subtitle")
            .html("Select a reflection from the scatter plot to view specific users");
        
        //Handle users histogram chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                adminExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Each user's reflections are shown sorted by time. The chart depicts the percentage of reflections in each reflection point group");
            });

        //Update charts depending on group
        adminExperimentalCharts.handleGroups();
        adminExperimentalCharts.handleGroupsColours();
        adminExperimentalCharts.handleGroupsSort();
    }
}

export async function buildControlAuthorAnalyticsCharts(entriesRaw: IReflectionAuthor[], analyticsRaw: IReflectionAnalytics[]) {
    let loading = new Loading();
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    const entries = d3.sort(entriesRaw.map((d, i) => { return {"timestamp": new Date(d.timestamp), "pseudonym": d.pseudonym, "point": d.point, "text": d.text, "tags": analyticsRaw[i].tags.map(d => processColour(d)), "matrix": analyticsRaw[i].matrix } as IRelfectionAuthorAnalytics }), d => d.timestamp);
    await drawCharts(entries);
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
    loading.isLoading = false;
    loading.removeDiv();

    function processColour(tag: ITags): ITags {
        if (tag.colour === undefined) {
            return {"start_index": tag.start_index, "tag": tag.tag, "phrase": tag.phrase, "colour": colourScale(tag.tag), "end_index": tag.end_index}
        }
        return tag;
    }

    async function drawCharts(entries: IRelfectionAuthorAnalytics[]) {
        let authorControlCharts = new AuthorControlCharts();
        authorControlCharts.preloadTags(entries);

        let networkChart = new ChartNetwork("network", "chart-container-network", entries.map(d => d.timestamp));
        let networkData = authorControlCharts.processNetworkData(networkChart, entries);
        networkChart.simulation = authorControlCharts.processSimulation(networkChart, networkData);
        authorControlCharts.renderNetwork(networkChart, networkData);

        //Handle timeline chart help
        d3.select("#network .card-title button")
            .on("click", function (e: Event) {
                authorControlCharts.help.helpPopover(d3.select("#network .zoom-rect.active"), `${networkChart.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                authorControlCharts.help.helpPopover(d3.select(this), `${networkChart.id}-help`, "<b>Network diagram</b><br>A network diagram that shows the phrases and tags associated to your reflections<br>The data represented are your <i>reflections over time</i>");
                let showDataHelp = authorControlCharts.help.helpPopover(networkChart.elements.contentContainer.select(".network-node-group"), `${networkChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
                if (showDataHelp) {
                    d3.select(`#${networkChart.id}-help-data`).style("top", parseInt(d3.select(`#${networkChart.id}-help-data`).style("top")) - 14 + "px");
                }
            });
        
        let timelineChart = new ChartTimeNetwork("timeline", entries.map(d => d.timestamp), new ChartPadding(40, 75, 10, 10));
        entries.forEach(c => authorControlCharts.processTimelineSimulation(timelineChart, timelineChart.x.scale(c.timestamp), timelineChart.y.scale(c.point), c.tags));
        authorControlCharts.renderTimeline(timelineChart, entries);

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                authorControlCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Timeline</b><br>Your reflections and the tags associated to them are shown over time");
                authorControlCharts.help.helpPopover(timelineChart.elements.contentContainer.select(".circle"), `${timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        authorControlCharts.renderReflections(entries);

        //Handle users histogram chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                authorControlCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Your reflections are shown sorted by time. The words with associated tags have a different background colour");
            });
    }
}

export async function buildExperimentAuthorAnalyticsCharts(entriesRaw: IReflectionAuthor[], analyticsRaw: IReflectionAnalytics[]) {
    let loading = new Loading();
    const colourScale = d3.scaleOrdinal(d3.schemeCategory10);
    const entries = d3.sort(entriesRaw.map((d, i) => { return {"timestamp": new Date(d.timestamp), "pseudonym": d.pseudonym, "point": d.point, "text": d.text, "tags": analyticsRaw[i].tags.map(d => processColour(d)), "matrix": analyticsRaw[i].matrix } as IRelfectionAuthorAnalytics }), d => d.timestamp);
    await drawCharts(entries);
    new Tutorial([new TutorialData("#timeline .card-title button", "Click the help symbol in any chart to get additional information"),
    new TutorialData("#timeline .circle", "Hover for information on demand"),
    new TutorialData("#network .network-node-group", "Hover for information on demand, zoom is also available")]);
    loading.isLoading = false;
    loading.removeDiv();

    function processColour(tag: ITags): ITags {
        if (tag.colour === undefined) {
            return {"start_index": tag.start_index, "tag": tag.tag, "phrase": tag.phrase, "colour": colourScale(tag.tag), "end_index": tag.end_index}
        }
        return tag;
    }

    async function drawCharts(entries: IRelfectionAuthorAnalytics[]) {
        let authorExperimentalCharts = new AuthorExperimentalCharts();
        authorExperimentalCharts.preloadTags(entries, true)

        authorExperimentalCharts.networkChart = new ChartNetwork("network", "chart-container-network", entries.map(d => d.timestamp));
        authorExperimentalCharts.allNetworkData = authorExperimentalCharts.processNetworkData(authorExperimentalCharts.networkChart, entries);
        authorExperimentalCharts.networkChart.simulation = authorExperimentalCharts.processSimulation(authorExperimentalCharts.networkChart, authorExperimentalCharts.allNetworkData);
        authorExperimentalCharts.renderNetwork(authorExperimentalCharts.networkChart, authorExperimentalCharts.allNetworkData);

        //Handle timeline chart help
        d3.select("#network .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select("#network .zoom-rect.active"), `${authorExperimentalCharts.networkChart.id}-help-zoom`, "use the mouse <u><i>wheel</i></u> to zoom me<br><u><i>click and hold</i></u> while zoomed to move");
                authorExperimentalCharts.help.helpPopover(d3.select(this), `${authorExperimentalCharts.networkChart.id}-help`, "<b>Network diagram</b><br>A network diagram that shows the phrases and tags associated to your reflections<br>The data represented are your <i>reflections over time</i>");
                let showDataHelp = authorExperimentalCharts.help.helpPopover(authorExperimentalCharts.networkChart.elements.contentContainer.select(".network-node-group"), `${authorExperimentalCharts.networkChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand<br><u><i>drag</i></u> me to rearrange the network");
                if (showDataHelp) {
                    d3.select(`#${authorExperimentalCharts.networkChart.id}-help-data`).style("top", parseInt(d3.select(`#${authorExperimentalCharts.networkChart.id}-help-data`).style("top")) - 14 + "px");
                }
            });

        authorExperimentalCharts.timelineChart = new ChartTimeNetwork("timeline", entries.map(d => d.timestamp), new ChartPadding(40, 75, 10, 10));
        entries.forEach(c => authorExperimentalCharts.processTimelineSimulation(authorExperimentalCharts.timelineChart, authorExperimentalCharts.timelineChart.x.scale(c.timestamp), authorExperimentalCharts.timelineChart.y.scale(c.point), c.tags));
        authorExperimentalCharts.renderTimeline(authorExperimentalCharts.timelineChart, entries);

        //Handle timeline chart help
        d3.select("#timeline .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Timeline</b><br>Your reflections and the tags associated to them are shown over time");
                authorExperimentalCharts.help.helpPopover(authorExperimentalCharts.timelineChart.elements.contentContainer.select(".point"), `${authorExperimentalCharts.timelineChart.id}-help-data`, "<u><i>hover</i></u> me for information on demand");
            });

        authorExperimentalCharts.renderReflections(entries);

        //Handle users histogram chart help
        d3.select("#reflections .card-title button")
            .on("click", function (e: Event) {
                authorExperimentalCharts.help.helpPopover(d3.select(this), "reflections-help", "<b>Reflections</b><br>Your reflections are shown sorted by time. The words with associated tags have a different background colour");
            });

        authorExperimentalCharts.handleTags();
        authorExperimentalCharts.handleTagsColours();
        authorExperimentalCharts.handleReflectionsSort();
    }
}