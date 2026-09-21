import { useMemo, useState } from 'react';

/**
 * Checkbox-selection state for a DataTable, keyed by `keyFn(row)` (defaults
 * to `row.id`) so it stays correct across re-fetches/filtering.
 */
export default function useRowSelection(rows, keyFn = (r) => r.id) {
    const safeRows = rows || [];
    const [selectedKeys, setSelectedKeys] = useState(() => new Set());

    const toggle = (row) => {
        const key = keyFn(row);
        setSelectedKeys(s => {
            const next = new Set(s);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const allSelected = safeRows.length > 0 && safeRows.every(r => selectedKeys.has(keyFn(r)));
    const toggleAll = () => setSelectedKeys(allSelected ? new Set() : new Set(safeRows.map(keyFn)));
    const clear = () => setSelectedKeys(new Set());

    const selectedRows = useMemo(
        () => safeRows.filter(r => selectedKeys.has(keyFn(r))),
        [safeRows, selectedKeys], // eslint-disable-line react-hooks/exhaustive-deps
    );

    return {
        isSelected: (row) => selectedKeys.has(keyFn(row)),
        toggle,
        allSelected,
        toggleAll,
        clear,
        selectedRows,
    };
}
