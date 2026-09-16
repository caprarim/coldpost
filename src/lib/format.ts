const clockFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const MINUTE = 60000;
const DAY = 86400000;

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function clock(ms: number) {
  return clockFormat.format(ms);
}

export function dayLabel(ms: number, now: number) {
  const diff = Math.round((startOfDay(ms) - startOfDay(now)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return dayFormat.format(ms);
}

export function dayKey(ms: number) {
  return startOfDay(ms);
}

export function span(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function lateness(at: number, now: number) {
  const minutes = Math.floor((now - at) / MINUTE);
  if (minutes < 1) return 'Now';
  return `${span(minutes)} late`;
}

export function countdown(at: number, now: number) {
  const minutes = Math.max(1, Math.ceil((at - now) / MINUTE));
  return `in ${span(minutes)}`;
}

export function nextSlot(now: number, leadMinutes = 10, step = 5) {
  const ms = step * MINUTE;
  return Math.ceil((now + leadMinutes * MINUTE) / ms) * ms;
}

export function withDate(base: number, picked: Date) {
  const d = new Date(base);
  d.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return d.getTime();
}

export function withTime(base: number, picked: Date) {
  const d = new Date(base);
  d.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return d.getTime();
}

export function normalizeHandle(raw: string) {
  const cleaned = raw.trim().replace(/\s+/g, '').replace(/^@+/, '');
  return cleaned ? `@${cleaned}` : '';
}
