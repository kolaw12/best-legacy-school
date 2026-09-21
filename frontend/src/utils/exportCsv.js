/**
 * Export an array of objects to CSV and trigger a download.
 * @param {Array<Object>} rows - Data to export
 * @param {Array<{key: string, label: string}>} columns - Column definitions
 * @param {string} filename - Download filename (without .csv)
 */
export function exportCsv(rows, columns, filename = 'export') {
    const header = columns.map(c => c.label).join(',');
    const body = rows.map(row =>
        columns.map(c => {
            let val = typeof c.render === 'function' ? c.render(row) : row[c.key];
            if (val === null || val === undefined) val = '';
            // Strip HTML tags
            if (typeof val === 'string' && val.includes('<')) {
                val = val.replace(/<[^>]*>/g, '');
            }
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        }).join(',')
    ).join('\n');

    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
