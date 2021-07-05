"use strict";
exports.__esModule = true;
var goingok_d3_1 = require("goingok-d3");
d3.csv("test-data.csv").then(function (c) {
    var data = c.map(function (r) {
        return {
            timestamp: new Date(r.timestamp),
            point: parseInt(r.point),
            pseudonym: r.pseudonym,
            groupCode: r.group_code,
            text: r.text
        };
    });
    var groupData = Array.from(d3.group(data, function (d) { return d.groupCode; }), function (_a) {
        var group = _a[0], value = _a[1];
        return ({ group: group, value: value });
    });
    goingok_d3_1.buildExperimentAdminAnalyticsCharts(groupData);
});
