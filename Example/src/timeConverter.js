export function secondsToTime(seconds) {
  if (!seconds) return '00:00'
  const minute = parseInt(seconds / 60)
  const second = parseInt(seconds % 60)
  let minuteStr = `0${minute}`
  if (minute >= 10) {
    minuteStr = `${minute}`
  }
  let secondStr = `0${second}`
  if (second >= 10) {
    secondStr = `${second}`
  }
  return `${minuteStr}:${secondStr}`
}
