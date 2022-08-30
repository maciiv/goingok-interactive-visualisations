//import * as d3 from "d3";
export class AdminAnalyticsData {
    constructor(group, value, createDate = undefined, colour = undefined, selected = false) {
        this.group = group;
        this.value = value;
        this.creteDate = createDate;
        this.colour = colour;
        this.selected = selected;
    }
    getUsersData() {
        let usersMean = Array.from(d3.rollup(this.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }));
        let test = groupBy(this.value, "pseudonym")
        console.log(test)
        console.log(usersMean)
        return new AdminAnalyticsData(this.group, usersMean, this.creteDate, this.colour);
    }
}

function groupBy(arr, criteria) {
    const newObj = arr.reduce(function (acc, currentValue) {
      if (!acc[currentValue[criteria]]) {
        acc[currentValue[criteria]] = [];
      }
      acc[currentValue[criteria]].push(currentValue);
      return acc;
    }, [{}]);
    return newObj;
  }

export class DataStats {
    constructor(stat, displayName, value) {
        this.stat = stat,
            this.displayName = displayName,
            this.value = value;
    }
}
export class AdminAnalyticsDataStats extends AdminAnalyticsData {
    constructor(entries) {
        super(entries.group, entries.value, entries.creteDate, entries.colour, entries.selected);
        let uniqueUsers = Array.from(d3.rollup(entries.value, d => d.length, d => d.pseudonym), ([key, value]) => ({ key, value }));
        this.stats = [];
        this.stats.push(new DataStats("usersTotal", "Users", uniqueUsers.length));
        this.stats.push(new DataStats("refTotal", "Reflections", entries.value.length));
        this.stats.push(new DataStats("mean", "Mean", Math.round(d3.mean(entries.value.map(r => r.point)))));
        this.stats.push(new DataStats("oldRef", "Oldest reflection", d3.min(entries.value.map(r => new Date(r.timestamp)))));
        this.stats.push(new DataStats("newRef", "Newest reflection", d3.max(entries.value.map(r => new Date(r.timestamp)))));
        this.stats.push(new DataStats("ruRate", "Reflections per user", Math.round(entries.value.length / uniqueUsers.length * 100) / 100));
    }
    ;
    roundDecimal(value) {
        let p = d3.precisionFixed(0.1);
        let f = d3.format("." + p + "f");
        return f(value);
    }
    ;
    getStat(stat) {
        var exists = this.stats.find(d => d.stat == stat);
        if (exists != undefined) {
            return exists;
        }
        else {
            return new DataStats("na", "Not found", 0);
        }
    }
}
