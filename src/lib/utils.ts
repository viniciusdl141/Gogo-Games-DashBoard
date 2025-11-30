import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts an Excel serial date number to a JavaScript Date object.
 * Excel serial dates start from January 1, 1900 (day 1).
 * @param serial The Excel serial date number.
 * @returns A JavaScript Date object.
 */
export function excelSerialDateToJSDate(serial: number): Date {
  // Excel serial date 1 is Jan 1, 1900. JS Date epoch is Jan 1, 1970.
  // The difference in days between 1900-01-01 and 1970-01-01 is 25569 days.
  // Excel also incorrectly treats 1900 as a leap year, so we subtract 1 day for the 1900 leap year error.
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const EXCEL_EPOCH_OFFSET = 25569; // Days between 1900-01-01 and 1970-01-01
  const LEAP_YEAR_ADJUSTMENT = 1; // Adjustment for Excel's 1900 leap year bug

  if (serial <= 0) {
    return new Date(NaN); // Invalid date
  }

  // Adjust for the epoch and the 1900 leap year bug
  const days = serial - EXCEL_EPOCH_OFFSET - LEAP_YEAR_ADJUSTMENT;
  
  // Convert days to milliseconds
  const milliseconds = days * MS_PER_DAY;

  // Create the date object. The Date constructor handles time zones based on the local environment,
  // but the calculation is based on UTC days since epoch.
  const date = new Date(milliseconds);

  return date;
}

/**
 * Formats a number as currency (USD by default).
 * @param amount The number to format.
 * @param currency The currency code (default: 'USD').
 * @returns The formatted currency string.
 */
export function formatCurrency(amount: number | null | undefined, currency: string = 'USD'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `$0.00`;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number with locale-specific separators.
 * @param amount The number to format.
 * @returns The formatted number string.
 */
export function formatNumber(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-US').format(amount);
}

/**
 * Formats a Date object or date string into a readable date format (e.g., 'MMM DD, YYYY').
 * @param dateInput The Date object, date string, or null/undefined.
 * @returns The formatted date string or an empty string if invalid.
 */
export function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) {
    return '';
  }

  let date: Date;

  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}