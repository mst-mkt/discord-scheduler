import { err, ok } from 'neverthrow'

export const validateDate = (date: string) => {
  const currentYear = new Date().getFullYear()
  const [year, month, day] = [currentYear.toString(), ...date.split('/')]
    .slice(-3)
    .map((v) => Number.parseInt(v, 10))

  if ([year, month, day].some((v) => Number.isNaN(v))) {
    return err('日付の形式が正しくありません。')
  }

  if (month < 1 || month > 12) {
    return err('月は1から12の間で指定してください。')
  }

  if (day < 1 || day > 31) {
    return err('日は1から31の間で指定してください。')
  }

  return ok(`${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`)
}

export const validateTime = (time?: string) => {
  if (time === undefined) return ok(undefined)
  const [hour, minute] = time.split(':').map((v) => Number.parseInt(v, 10))

  if ([hour, minute].some((v) => Number.isNaN(v))) {
    return err('時間の形式が正しくありません。')
  }

  if (hour < 0 || hour > 23) {
    return err('時間は0から23の間で指定してください。')
  }

  if (minute < 0 || minute > 59) {
    return err('分は0から59の間で指定してください。')
  }

  return ok(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
}

export const generateDataTime = (date: string, time?: string) => {
  const [year, month, day] = date.split('/').map((v) => Number.parseInt(v, 10))
  const [hour, minute] = time?.split(':').map((v) => Number.parseInt(v, 10)) ?? [0, 0]

  const dateTime = new Date(year, month - 1, day, hour, minute)

  return dateTime
}

export const getJstDate = () => {
  const current = new Date()
  return new Date(current.getTime() + (current.getTimezoneOffset() + 540) * 60 * 1000)
}
