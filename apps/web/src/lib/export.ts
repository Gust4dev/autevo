import * as XLSX from 'xlsx';

export function exportToExcel(
    data: any[] | any[][] | Record<string, any[] | any[][]>,
    fileName: string,
    defaultSheetName: string = 'Relatório'
) {
    const workbook = XLSX.utils.book_new();

    const applyStyles = (ws: XLSX.WorkSheet) => {
        const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
        const cols: { wch: number }[] = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxLen = 0;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                if (!cell) continue;
                const val = XLSX.utils.format_cell(cell);
                if (val.length > maxLen) maxLen = val.length;
            }
            cols[C] = { wch: maxLen + 2 };
        }
        ws['!cols'] = cols;
    };

    const createSheet = (sheetData: any[] | any[][]): XLSX.WorkSheet => {
        let ws: XLSX.WorkSheet;
        if (Array.isArray(sheetData[0])) {
            ws = XLSX.utils.aoa_to_sheet(sheetData as any[][]);
        } else {
            ws = XLSX.utils.json_to_sheet(sheetData as any[]);
        }
        applyStyles(ws);
        return ws;
    };

    if (Array.isArray(data)) {
        const worksheet = createSheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, defaultSheetName);
    } else {
        Object.entries(data).forEach(([sheetName, sheetData]) => {
            const worksheet = createSheet(sheetData);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        });
    }

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function formatFilenameDate(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
}
