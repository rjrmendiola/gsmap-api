const ExcelJS = require('exceljs');
const { parse } = require('csv-parse/sync');

async function parseCSV(buffer) {
    let rows = [];
    rows = parse(buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    return rows;
}

async function parseExcel(buffer) {
    let rows = [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    const headers = [];

    worksheet.getRow(1).eachCell(cell => {
        headers.push(cell.text.trim().toLowerCase());
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNum) => {
        if (rowNum === 1) return;

        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = row.getCell(index + 1).text.trim();
        });

        rows.push(obj);
    });

    return rows;
}

module.exports = {
    parseExcel,
    parseCSV
};
