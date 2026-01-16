import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

const MOSCOW_TIMEZONE = 'Europe/Moscow';

/**
 * Форматирует дату в московском часовом поясе (UTC+3)
 */
export function formatMoscow(date: Date | string | number, formatStr: string, options?: { locale?: typeof ru }): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const moscowDate = toZonedTime(dateObj, MOSCOW_TIMEZONE);
  return format(moscowDate, formatStr, { locale: options?.locale || ru, ...options });
}

/**
 * Конвертирует дату в московский часовой пояс
 */
export function toMoscowTime(date: Date | string | number): Date {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return toZonedTime(dateObj, MOSCOW_TIMEZONE);
}

export { ru };

