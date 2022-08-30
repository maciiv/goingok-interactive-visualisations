import * as d3 from "d3";
import { groupBy } from "../utils/utils";


export interface IReflectionAuthor {
    timestamp: Date;
    pseudonym: string;
    point: number;
    text: string;
}

export interface IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    getUsersData(): AdminAnalyticsData;
}

export class AdminAnalyticsData implements IAdminAnalyticsData {
    group: string;
    value: IReflectionAuthor[];
    creteDate: Date;
    colour: string;
    selected: boolean;
    constructor(group: string, value: IReflectionAuthor[], createDate: Date = undefined, colour: string = undefined, selected: boolean = false) {
        this.group = group;
        this.value = value;
        this.creteDate = createDate;
        this.colour = colour;
        this.selected = selected;
    }
    getUsersData(): AdminAnalyticsData {
        let usersMean = Array.from(d3.rollup(this.value, d => Math.round(d3.mean(d.map(r => r.point))), d => d.pseudonym), ([pseudonym, point]) => ({ pseudonym, point }) as IReflectionAuthor);
        let test = groupBy(this.value, "pseudonym");
        console.log(test)
        return new AdminAnalyticsData(this.group, usersMean, this.creteDate, this.colour);
    }
}

export interface IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
}

export class DataStats implements IDataStats {
    stat: string;
    displayName: string;
    value: number | Date;
    constructor(stat: string, displayName: string, value: number | Date){
        this.stat = stat,
        this.displayName = displayName,
        this.value = value
    }
}

export interface IAdminAnalyticsDataStats extends IAdminAnalyticsData {
    stats: IDataStats[];
    roundDecimal(value: number): string;
    getStat(stat: string): IDataStats;
}

export class AdminAnalyticsDataStats extends AdminAnalyticsData implements IAdminAnalyticsDataStats {
    stats: IDataStats[];
    constructor(entries: IAdminAnalyticsData) {
        super(entries.group, entries.value, entries.creteDate, entries.colour, entries.selected);
        let uniqueUsers = Array.from(d3.rollup(entries.value, d => d.length, d => d.pseudonym), ([key, value]) => ({ key, value }));
        this.stats = [];
        this.stats.push(new DataStats("usersTotal", "Users", uniqueUsers.length))
        this.stats.push(new DataStats("refTotal", "Reflections", entries.value.length))
        this.stats.push(new DataStats("mean", "Mean", Math.round(d3.mean(entries.value.map(r => r.point)))));
        this.stats.push(new DataStats("oldRef", "Oldest reflection", d3.min(entries.value.map(r => new Date(r.timestamp)))))
        this.stats.push(new DataStats("newRef", "Newest reflection", d3.max(entries.value.map(r => new Date(r.timestamp)))))
        this.stats.push(new DataStats("ruRate", "Reflections per user", Math.round(entries.value.length / uniqueUsers.length * 100) / 100))
    };
    roundDecimal(value: number): string {
        let p = d3.precisionFixed(0.1);
        let f = d3.format("." + p + "f");
        return f(value);
    };
    getStat(stat: string): IDataStats {
        var exists = this.stats.find(d => d.stat == stat);
        if (exists != undefined) {
            return exists;
        } else {
            return new DataStats("na", "Not found", 0);
        }
    }
}