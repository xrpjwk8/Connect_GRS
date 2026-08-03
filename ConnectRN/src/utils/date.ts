export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const WEEKDAY_LETTERS = ['일', '월', '화', '수', '목', '금', '토'];

// 백엔드 date "yyyy-MM-dd" -> 로컬 자정 Date (시간대 이슈 없이 날짜만 사용)
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addThirtyMinutesLabel(time: string): string {
  const [hourStr, minuteStr] = time.split(':');
  const totalMinutes = Number(hourStr) * 60 + Number(minuteStr) + 30;
  const newHour = Math.floor(totalMinutes / 60) % 24;
  const newMinute = totalMinutes % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
}

// "6/3 (화) 19:00" 또는 다중 슬롯이면 "6/3 (화) 19:00 ~ 20:00"
export function formatReservationDateLabel(dateIso: string, timeLabels: string[]): string {
  const date = parseIsoDate(dateIso);
  const datePart = `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAY_LETTERS[date.getDay()]})`;
  if (timeLabels.length === 0) return datePart;
  const sorted = [...timeLabels].sort();
  const timePart =
    sorted.length === 1 ? sorted[0] : `${sorted[0]} ~ ${addThirtyMinutesLabel(sorted[sorted.length - 1])}`;
  return `${datePart} ${timePart}`;
}
