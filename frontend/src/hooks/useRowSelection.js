import { useMemo, useState } from 'react';

/**
 * Checkbox-selection state for a DataTable, keyed by `keyFn(row)` (defaults
 * to `row.id`) so it stays correct across re-fetches/filtering.
 */
export default function useRowSelection(rows, keyFn = (r) => r.id) {
    const [selectedKeys, setSelectedKeys] = useState(() => new Set());

    const toggle = (row) => {
        const key = keyFn(row);
        setSelectedKeys(s => {
            const next = new Set(s);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const allSelected = rows.length > 0 && rows.every(r => selectedKeys.has(keyFn(r)));
    const toggleAll = () => setSelectedKeys(allSelected ? new Set() : new Set(rows.map(keyFn)));
    const clear = () => setSelectedKeys(new Set());

    const selectedRows = useMemo(
        () => rows.filter(r => selectedKeys.has(keyFn(r))),
        [rows, selectedKeys], // eslint-disable-line react-hooks/exhaustive-deps
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
