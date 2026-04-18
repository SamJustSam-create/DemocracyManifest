const { DateTime } = require('luxon');

const SYDNEY_TZ = 'Australia/Sydney';

/**
 * Returns the current DateTime in the Sydney timezone (handles AEST/AEDT automatically).
 */
function getSydneyNow() {
  return DateTime.now().setZone(SYDNEY_TZ);
}

/**
 * Returns the current timezone abbreviation: 'AEST' or 'AEDT'.
 */
function getSydneyAbbreviation() {
  return getSydneyNow().toFormat('z');
}

/**
 * Parse a time string in HH:MM format.
 * Returns { hour, minute } or null if invalid.
 */
function parseCurfewTime(timeStr) {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/**
 * Returns the number of milliseconds from now until the next 9:00 AM Sydney time.
 * If it is already past 9:00 AM today, targets 9:00 AM tomorrow.
 */
function getMsUntilCurfewEnd() {
  const now = getSydneyNow();
  let target = now.startOf('day').plus({ hours: 9 });
  if (now >= target) {
    target = target.plus({ days: 1 });
  }
  return Math.max(target.diff(now).milliseconds, 0);
}

/**
 * Returns today's date string in Sydney timezone (YYYY-MM-DD).
 */
function getSydneyDateStr() {
  return getSydneyNow().toISODate();
}

/**
 * Returns true if the current Sydney time is at or past the given curfew hour/minute.
 */
function isCurfewActive(hour, minute) {
  const now = getSydneyNow();
  const curfewMinutes = hour * 60 + minute;
  const nowMinutes = now.hour * 60 + now.minute;
  return nowMinutes >= curfewMinutes;
}

module.exports = {
  getSydneyNow,
  getSydneyAbbreviation,
  parseCurfewTime,
  getMsUntilCurfewEnd,
  getSydneyDateStr,
  isCurfewActive,
};
