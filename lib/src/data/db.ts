import {
	IReflectionAuthor,
	AdminAnalyticsData,
	AuthorAnalyticsData,
	IReflection,
	INodes,
	IEdges,
	Analytics,
	NodeType,
} from './data'
import { ngrams } from './ngrams'

export interface IReflectionAuthorRaw {
	refId: string
	timestamp: string
	pseudonym: string
	point: string
	text: string
	transformData(): IReflectionAuthor
}

export interface IAdminAnalyticsDataRaw {
	group: string
	value: IReflectionAuthorRaw[]
	createDate: string
	transformData(): AdminAnalyticsData
}

export class AdminAnalyticsDataRaw implements IAdminAnalyticsDataRaw {
	group: string
	value: IReflectionAuthorRaw[]
	createDate: string
	constructor(
		group: string,
		value: IReflectionAuthorRaw[],
		createDate: string
	) {
		this.group = group
		this.value = value
		this.createDate = createDate
	}
	transformData(): AdminAnalyticsData {
		return new AdminAnalyticsData(
			this.group,
			this.value.map((d) => {
				return {
					refId: parseInt(d.refId),
					timestamp: new Date(d.timestamp),
					pseudonym: d.pseudonym,
					point: parseInt(d.point),
					text: d.text,
				}
			}) as IReflectionAuthor[],
			new Date(this.createDate),
			undefined,
			false
		)
	}
}

export interface IAuthorEntriesRaw {
	pseudonym: string
	reflections: IReflectionAuthorRaw[]
}

export interface IAnalyticsEntriesRaw {
	nodes: INodes[]
	edges: IEdges<number | INodes>[]
}

export interface IAuthorAnalyticsEntriesRaw {
	pseudonym: string
	analytics: IAnalyticsEntriesRaw
}

export interface IAuthorAnalyticsDataRaw {
	pseudonym: string
	reflections: IReflectionAuthorRaw[]
	analytics: IAnalyticsEntriesRaw
	transformData(): AuthorAnalyticsData
}

export class AuthorAnalyticsDataRaw implements IAuthorAnalyticsDataRaw {
	pseudonym: string
	reflections: IReflectionAuthorRaw[]
	analytics: IAnalyticsEntriesRaw
	constructor(
		entries: IReflectionAuthorRaw[],
		pseudonym: string,
		analytics?: IAuthorAnalyticsEntriesRaw
	) {
		this.pseudonym = pseudonym
		this.reflections = entries
		this.analytics =
			analytics === undefined
				? this.createEmptyAnalytics()
				: analytics.analytics.nodes.length !== 0
				? analytics.analytics
				: this.createAnalytics(entries)
	}
	transformData(colourScale?: Function): AuthorAnalyticsData {
		let reflections = this.reflections.map((d) => {
			return {
				refId: parseInt(d.refId),
				timestamp: new Date(d.timestamp),
				point: parseInt(d.point),
				text: d.text,
			} as IReflection
		})
		return new AuthorAnalyticsData(
			reflections,
			new Analytics(reflections, this.analytics.nodes, this.analytics.edges),
			this.pseudonym,
			colourScale
		)
	}
	private createAnalytics(
		entries: IReflectionAuthorRaw[]
	): IAnalyticsEntriesRaw {
		let idx = 0
		const nodes = entries.map((c) => {
			let nodes = [] as INodes[]
			ngrams.forEach((d) => {
				const regex = new RegExp(d.ngram, 'ig')
				const search = this.searchNgram(c.text, regex)
				if (search.length > 0) {
					search.forEach((s) => {
						idx = idx + 1
						nodes.push({
							idx: idx,
							startIdx: s - d.ngram.length,
							endIdx: s - 1,
							nodeCode: d.category,
							nodeType: NodeType.Sys,
							refId: parseInt(c.refId),
							expression: d.ngram,
							properties: {},
							labelType: 'SYS',
							description: d.description,
							name: d.name,
							total: 1,
							selected: true,
						})
					})
				}
			})
			return nodes
		})
		return { nodes: nodes.flat(), edges: [] }
	}
	private createEmptyAnalytics(): IAnalyticsEntriesRaw {
		return { nodes: [], edges: [] }
	}
	private searchNgram(text: string, regex: RegExp): number[] {
		const result: number[] = []
		let array1
		while ((array1 = regex.exec(text)) !== null) {
			result.push(regex.lastIndex)
		}
		return result
	}
}
