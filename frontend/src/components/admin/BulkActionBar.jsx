import { Trash2 } from 'lucide-react';

/**
 * "N selected — delete" bar that appears above the table once something's
 * checked. Shared across every admin list page that supports bulk delete.
 * Pair with useRowSelection + selectionColumn (./selectionColumn).
 */
const BulkActionBar = ({ count, label = 'Delete', onAction, className = '' }) => {
    if (!count) return null;
    return (
        <div className={`flex items-center gap-3 shrink-0 ${className}`}>
            <span className="text-sm text-gray-500 whitespace-nowrap">{count} selected</span>
            <button
                onClick={onAction}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition whitespace-nowrap"
            >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={2} /> {label} ({count})
            </button>
        </div>
    );
};

export default BulkActionBar;
