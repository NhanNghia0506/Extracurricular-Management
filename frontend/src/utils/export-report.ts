import * as XLSX from 'xlsx';

type ExportCellValue = string | number;
export type ExportRow = Record<string, ExportCellValue>;

const escapeCsvValue = (value: ExportCellValue): string => {
    const stringValue = String(value ?? '');
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
};

const triggerDownload = (blob: Blob, fileName: string): void => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
};

export const buildSafeFileName = (prefix: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const normalizedPrefix = prefix.replace(/[^a-zA-Z0-9-_]/g, '-');
    return `${normalizedPrefix}-${timestamp}`;
};

export const exportRowsToCsv = (rows: ExportRow[], fileName: string): void => {
    if (!rows.length) {
        throw new Error('Không có dữ liệu để xuất CSV.');
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
        headers.map(escapeCsvValue).join(','),
        ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header] ?? '')).join(',')),
    ];

    const csvContent = `\uFEFF${csvLines.join('\r\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, fileName);
};

export const exportRowsToXlsx = (rows: ExportRow[], fileName: string, sheetName: string = 'Report'): void => {
    if (!rows.length) {
        throw new Error('Không có dữ liệu để xuất Excel.');
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const headers = Object.keys(rows[0]);

    worksheet['!cols'] = headers.map((header) => ({
        wch: Math.max(header.length + 2, 16),
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
};
