/**
 * Parse timestamps from Postgres / Supabase for display in the visitor's real timezone.
 *
 * `timestamptz` is stored in UTC. Drivers sometimes return ISO strings **without** `Z`
 * or `+00:00`. ECMAScript parses those as *local* time, which shifts the clock by
 * the user's UTC offset. We treat naive ISO datetimes as UTC, then `toLocale*`
 * converts correctly to local time.
 */

const FR = 'fr-FR';

function hasExplicitTimeZone(s) {
  return /[zZ]$/.test(s) || /[+-]\d{2}:\d{2}$/.test(s) || /[+-]\d{4}$/.test(s);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @returns {Date | null}
 */
export function parseDbDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const s = String(value).trim();

  // Calendar date only — spec parses YYYY-MM-DD as UTC midnight; keep as-is for dates
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (hasExplicitTimeZone(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  let normalized = s.includes('T') ? s : s.replace(' ', 'T');
  // Trim sub-millisecond noise some drivers return
  normalized = normalized.replace(/(\.\d{3})\d+/, '$1');

  const d = new Date(`${normalized}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * @param {string | number | Date | null | undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatLocaleTime(value, options = {}) {
  const d = parseDbDateTime(value);
  if (!d) return '—';
  return d.toLocaleTimeString(FR, {
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

/**
 * @param {string | number | Date | null | undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatLocaleDate(value, options = {}) {
  const d = parseDbDateTime(value);
  if (!d) return '—';
  return d.toLocaleDateString(FR, options);
}

/**
 * @param {string | number | Date | null | undefined} value
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export function formatLocaleDateTime(value, options = {}) {
  const d = parseDbDateTime(value);
  if (!d) return '—';
  return d.toLocaleString(FR, options);
}
