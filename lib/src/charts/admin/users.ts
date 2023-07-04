import { select, selectAll, sort, BaseType } from 'd3'
import { IAdminAnalyticsData, IReflectionAuthor } from '../../data/data'
import { Sort } from '../../interactions/sort'
import { calculateMean, groupBy, maxDate, minDate } from '../../utils/utils'
import { ChartHelp, IChartHelp } from '../chartBase'

type UserData = {
	pseudonym: string
	avg: number
	total: number
	minDate: Date
	maxDate: Date
	reflections: IReflectionAuthor[]
}

export class Users {
	id: string
	sort: Sort<UserData>
	group: string
	help: IChartHelp
	private _data: IAdminAnalyticsData[]
	get data() {
		return this._data
	}
	set data(entries: IAdminAnalyticsData[]) {
		this._data = entries.filter((d) => d.selected)
		this.render()
	}
	private _thresholds = [30, 70]
	get thresholds() {
		return this._thresholds
	}
	set thresholds(thresholds: number[]) {
		this._thresholds = thresholds
		selectAll(`#${this.id} meter`)
			.attr('low', this.thresholds[0])
			.attr('high', this.thresholds[1])
	}
	constructor(data: IAdminAnalyticsData[]) {
		this.id = 'reflections'
		this.group = data[0].group
		this.sort = new Sort(this.id, 'pseudonym')
		this.help = new ChartHelp(this.id)
		this.data = data
	}
	render() {
		const _this = this

		select(`#${_this.id} .nav.nav-tabs`)
			.selectAll('li')
			.data(_this.data)
			.join(
				(enter) =>
					enter
						.append('li')
						.attr('class', 'nav-item pointer')
						.append('a')
						.attr('class', 'nav-link')
						.classed('active', (d, i) => i === 0)
						.html((d) => d.group)
						.on('click', function (e, d) {
							select(`#${_this.id} .nav.nav-tabs`)
								.selectAll('a')
								.classed('active', false)
							select(this).classed('active', true)
							_this.group = d.group
							_this.renderTabContent(_this.getUserData(d.value))
						}),
				(update) =>
					update
						.select('a')
						.classed('active', (d, i) => i == 0)
						.html((d) => d.group),
				(exit) => exit.remove()
			)

		if (_this.data.length === 0) {
			_this.renderNoData()
			return
		}

		_this.handleSort()
		_this.renderTabContent(_this.getUserData(_this.data[0].value))
	}
	private renderTabContent(data: UserData[]): void {
		const _this = this

		const minUser = data.reduce((a, b) => {
			return a.avg < b.avg ? a : b
		})
		const maxUser = data.reduce((a, b) => {
			return a.avg > b.avg ? a : b
		})

		select(`#${_this.id} .text-muted`).html(
			data.length === 1
				? `The user ${data[0].pseudonym} has a total of ${
						data[0].total
				  } reflections between
                ${data[0].minDate.toDateString()} and ${data[0].maxDate.toDateString()}`
				: `The user ${minUser.pseudonym} is the most distressed, while the user ${maxUser.pseudonym} is the most soaring`
		)

		select(`#${_this.id} .tab-content`)
			.selectAll('div .statistics-text')
			.data(_this.sort.sortData(data))
			.join(
				(enter) =>
					enter
						.append('div')
						.attr('class', 'row statistics-text')
						.attr('id', (d) => d.pseudonym)
						.call((div) =>
							div
								.append('div')
								.attr('class', 'col-md-4')
								.call((div) =>
									div
										.append('div')
										.attr('class', 'sticky-top')
										.call((div) =>
											div
												.append('h5')
												.attr('class', 'mb-0 mt-1')
												.html((d) => `${d.pseudonym} <small>average is</small>`)
										)
										.call((div) => div.append((d) => _this.renderUserMeter(d)))
								)
						)
						.call((div) =>
							div
								.append('div')
								.attr('class', 'col-md-8')
								.append('p')
								.attr('class', 'mb-1')
								.call((p) =>
									p
										.append('span')
										.html(
											(d) =>
												`User ${d.pseudonym} reflections in chronological order:`
										)
								)
								.call((p) =>
									p
										.append('ul')
										.attr('class', 'pr-3')
										.call((ul) => _this.renderReflections(ul))
								)
						),
				(update) =>
					update
						.attr('id', (d) => d.pseudonym)
						.call((update) =>
							update
								.select('h5')
								.html((d) => `${d.pseudonym} <small>average is</small>`)
						)
						.call((update) =>
							update.select('meter').attr('value', (d) => d.avg)
						)
						.call((update) =>
							update
								.select('p span')
								.html(
									(d) =>
										`User ${d.pseudonym} reflections in chronological order:`
								)
						)
						.call((update) => _this.renderReflections(update.select('p ul'))),
				(exit) => exit.remove()
			)
	}
	private renderReflections(
		update: d3.Selection<BaseType, UserData, BaseType, unknown>
	): void {
		update
			.selectAll('li')
			.data((d) => sort(d.reflections, (r) => r.timestamp))
			.join(
				(enter) =>
					enter
						.append('li')
						.classed('reflection-selected', (d) => d.selected)
						.html(
							(d) =>
								`<i>${d.timestamp.toDateString()} | Reflection state point ${
									d.point
								}</i><br> ${d.text}`
						),
				(update) =>
					update
						.classed('reflection-selected', (d) => d.selected)
						.html(
							(d) =>
								`<i>${d.timestamp.toDateString()} | Reflection state point ${
									d.point
								}</i><br> ${d.text}`
						),
				(exit) => exit.remove()
			)
	}
	private handleSort() {
		const _this = this
		const id = 'sort-users'
		selectAll(`#${id} .btn-group label`).on(
			'click',
			function (this: HTMLLabelElement) {
				const selectedOption = (this.control as HTMLInputElement).value
				_this.sort.sortBy = selectedOption
				let sortedData = _this.getUserData(
					_this.data.find((d) => d.group === _this.group).value
				)
				_this.renderTabContent(sortedData)
			}
		)
	}
	private renderUserMeter(data: UserData): HTMLDivElement {
		const row = document.createElement('div')
		row.classList.add('row', 'mt-1')
		const scale = meterScale()
		row.appendChild(scale[0])
		row.appendChild(scale[1])
		row.appendChild(scale[2])
		const meterCol = document.createElement('div')
		meterCol.classList.add('col-12')
		const meter = document.createElement('meter')
		meter.classList.add('w-100', 'user-meter')
		meter.setAttribute('max', '100')
		meter.setAttribute('value', data.avg.toString())
		meter.setAttribute('low', this.thresholds[0].toString())
		meter.setAttribute('optimum', '99.99')
		meter.setAttribute('high', this.thresholds[1].toString())
		meterCol.appendChild(meter)
		row.appendChild(meterCol)
		return row

		function meterScale(): HTMLDivElement[] {
			const labels = ['distressed', 'going ok', 'soaring']
			let scale = [] as HTMLDivElement[]
			labels.forEach((c) => {
				let label = meterLabel(c)
				c === 'going ok' ? label.classList.add('text-center') : null
				c === 'soaring' ? label.classList.add('text-end') : null
				scale.push(label)
			})
			return scale
		}

		function meterLabel(name: string): HTMLDivElement {
			let col = document.createElement('div')
			col.classList.add('col-4', 'xx-small')
			col.innerHTML = name
			return col
		}
	}
	private renderNoData(): void {
		select(`#${this.id} .text-muted`).html(
			'Add group codes from the left sidebar'
		)

		select(`#${this.id} .tab-content`)
			.selectAll('div .statistics-text')
			.remove()
	}
	private getUserData(data: IReflectionAuthor[]): UserData[] {
		return groupBy(data, 'pseudonym').map((d) => {
			return {
				pseudonym: d.key,
				avg: calculateMean(d.value.map((c) => c.point)),
				total: d.value.length,
				minDate: minDate(d.value.map((c) => c.timestamp)),
				maxDate: maxDate(d.value.map((c) => c.timestamp)),
				reflections: d.value,
			} as UserData
		})
	}
}
