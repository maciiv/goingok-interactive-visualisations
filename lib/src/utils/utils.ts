export interface IGroupBy<T> {
  key: string,
  value: Array<T>
}

export function groupBy<T>(arr: Array<T>, criteria: string) {
    const newObj = arr.reduce(function (acc: IGroupBy<T>[], currentValue: any) {
      if (!acc.map(d => d.key).includes(currentValue[criteria])) {
        acc.push({"key": currentValue[criteria], "value": []})
      }
      acc.find(d => d.key == currentValue[criteria]).value.push(currentValue)
      return acc
    }, [])
    return newObj
}

export function caculateSum(arr: number[]) {
  let sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum
}

export function calculateMean(arr: number[]) {
  return caculateSum(arr) / arr.length
}