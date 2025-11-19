import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to convert Excel serial date (number of days since 1899-12-30) to JS Date
export function excelSerialDateToJSDate(serial: number): Date | null {
  if (typeof serial !== 'number' || serial <= 0) return null;
  // 25569 is the number of days between 1899-12-30 and 1970-01-01.
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  // Subtract 1 day because Excel counts 1900-02-29 which didn't exist.
  const date = new Date(Math.round((serial - 25569) * MS_PER_DAY));
  return date;
}

export function formatDate(date: Date | number | null): string {
    if (!date) return '-';
    
    let dateToFormat: Date;

    if (typeof date === 'number') {
        const jsDate = excelSerialDateToJSDate(date);
        if (!jsDate) return '-';
        dateToFormat = jsDate;
    } else {
        dateToFormat = date;
    }
    
    // Check validity before formatting to prevent 'Invalid time value' errors
    if (!isValid(dateToFormat)) {
        return '-';
    }

    return format(dateToFormat, 'dd/MM/yyyy', { locale: ptBR });
}

export function formatCurrency(value: number | string | undefined): string {
    if (value === undefined || value === null || value === '' || isNaN(Number(value))) return '-';
    return `R$ ${Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function formatNumber(value: number | string | undefined): string {
    if (value === undefined || value === null || value === '' || isNaN(Number(value))) return '-';
    return Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}