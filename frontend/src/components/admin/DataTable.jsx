import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

/**
 * Minimal, premium-looking data table.
 * columns: [{ key, label, render?: (row) => ReactNode, className?: string }]
 *
 * Loading -> shimmer skeleton rows.
 * Empty   -> EmptyState card. Pass `emptyIcon`, `emptyTitle`, `emptyBody`,
 *            `emptyAction` for a verb-led empty rather than the dead default.
 */
const DataTable = ({
    columns,
    rows,
    loading,
    empty = 'No records yet.',
    emptyIcon,
    emptyTitle,
    emptyBody,
    emptyAction,
    onRowClick,
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!rows.length) {
        return (
            <EmptyState
                icon={emptyIcon || '📋'}
                title={emptyTitle || (typeof empty === 'string' ? empty : 'Nothing here yet')}
                body={emptyBody || (typeof empty === 'string' ? null : empty)}
                action={emptyAction}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            {columns.map(col => (
                                <th key={col.key}
                                    className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-widest text-gray-500 ${col.className || ''}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr
                                key={row.id ?? i}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={`border-b border-gray-50 last:border-b-0 hover:bg-primary-soft/30 transition ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map(col => (
                                    <td key={col.key} className={`px-4 py-3 text-ink ${col.className || ''}`}>
                                        {col.render ? col.render(row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
