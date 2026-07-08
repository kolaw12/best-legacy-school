/** DataTable column def for a row-selection checkbox — pair with useRowSelection. */
export const selectionColumn = (selection) => ({
    key: 'select',
    label: (
        <input
            type="checkbox"
            checked={selection.allSelected}
            onChange={selection.toggleAll}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
        />
    ),
    render: (row) => (
        <input
            type="checkbox"
            checked={selection.isSelected(row)}
            onChange={() => selection.toggle(row)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary-soft"
        />
    ),
});
