import { calculateMean, groupBy } from "../utils/utils.js";
export class AdminAnalyticsData {
    constructor(group, value, createDate = undefined, colour = undefined, selected = true) {
        this.group = group;
        this.value = value;
        this.createDate = createDate;
        this.colour = colour;
        this.selected = selected;
        let uniqueUsers = groupBy(value, "pseudonym");
        this.usersTotal = uniqueUsers.length;
        this.refTotal = value.length;
        this.mean = Math.round(calculateMean(value.map(r => r.point)));
        this.ruRate = Math.round(value.length / uniqueUsers.length * 100) / 100;
    }
}
export class DataStats {
    constructor(stat, displayName, value) {
        this.stat = stat,
            this.displayName = displayName,
            this.value = value;
    }
}
export class TimelineData {
    constructor(data, colour, group) {
        this.refId = data.refId;
        this.timestamp = data.timestamp;
        this.pseudonym = data.pseudonym;
        this.point = data.point;
        this.text = data.text;
        this.colour = colour;
        this.group = group;
    }
}
export class HistogramData extends AdminAnalyticsData {
    constructor(value, group, colour, bin, percentage) {
        super(group, value, undefined, colour);
        this.bin = bin;
        this.percentage = percentage;
    }
}
export class UserChartData {
    constructor(bin, value, percentage, isGroup) {
        if (bin.x0 == 0) {
            this.binName = "distressed";
        }
        else if (bin.x1 == 100) {
            this.binName = "soaring";
        }
        else {
            this.binName = "going ok";
        }
        this.percentage = percentage;
        this.isGroup = isGroup;
    }
}
export class ClickTextData {
    constructor(clickStat, dataStat, clickGroup, dataGroup) {
        this.clickData = { stat: clickStat, group: clickGroup },
            this.data = { stat: dataStat, group: dataGroup };
    }
}
export class AuthorAnalyticsData {
    constructor(reflections, analytics, pseudonym, colourScale) {
        this.reflections = reflections.map(c => {
            let nodes = JSON.parse(JSON.stringify(analytics.nodes.filter(r => r.refId === c.refId)));
            nodes.forEach(r => this.processColour(r, colourScale));
            return { "refId": c.refId, "timestamp": c.timestamp, "point": c.point, "text": c.text, "nodes": nodes };
        });
        analytics.nodes.forEach(r => this.processColour(r, colourScale));
        this.analytics = analytics;
        this.pseudonym = pseudonym;
    }
    processColour(node, colourScale) {
        if (node.properties["color"] === undefined) {
            node.properties = { "color": colourScale(node.name) };
        }
        return node;
    }
}
//# sourceMappingURL=data.js.map