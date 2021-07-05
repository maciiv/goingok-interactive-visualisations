import {buildExperimentAdminAnalyticsCharts} from "goingok-d3"

d3.csv("test-data.csv").then(c => {
    let data = c.map(r => {
        return {
            timestamp: new Date(r.timestamp),
            point: parseInt(r.point),
            pseudonym: r.pseudonym,
            groupCode: r.group_code,
            text: r.text
        };
    });
    let groupData = Array.from(d3.group(data, d => d.groupCode), ([group, value]) => ({ group, value }));
    buildExperimentAdminAnalyticsCharts(groupData);
});