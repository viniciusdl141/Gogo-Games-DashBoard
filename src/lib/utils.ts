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
        // Heurística: Se o número for muito grande (maior que 100000, que é aproximadamente 2240), 
        // assumimos que é um timestamp JS em milissegundos.
        if (date > 10000000000) { // 10 bilhões de milissegundos (aprox. 1970-04-26)
            dateToFormat = new Date(date);
        } else {
            // Caso contrário, assumimos que é um serial date do Excel
            const jsDate = excelSerialDateToJSDate(date);
            if (!jsDate) return '-';
            dateToFormat = jsDate;
        }
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

// New function to convert data array to CSV string and trigger download
export function convertToCSV<T extends Record<string, any>>(data: T[], filename: string): void {
    if (data.length === 0) {
        console.warn("No data to export.");
        return;
    }

    // Use keys from the first object as headers
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
        const values = headers.map(header => {
            let value = row[header];
            
            // Handle Date objects
            if (value instanceof Date) {
                value = format(value, 'yyyy-MM-dd', { locale: ptBR });
            } 
            
            // Handle numbers (ensure proper formatting for CSV)
            else if (typeof value === 'number') {
                value = String(value);
            }
            
            // Handle strings that might contain commas or quotes
            else if (typeof value === 'string') {
                // Escape double quotes and wrap in double quotes if it contains comma or double quotes
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
            }
            
            // Handle null/undefined/non-numeric values
            else if (value === null || value === undefined || value === '-') {
                value = '';
            }

            return value;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    
    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}