/**
 * Empty-state card with a verb-led action — never just "No data yet".
 *
 * <EmptyState
 *   icon="📝"
 *   title="No assignments yet"
 *   body='Click "+ New assignment" to set the first one.'
 *   action={<Button size="sm" onClick={...}>Create one</Button>}
 * />
 */
const EmptyState = ({ icon = '✨', title, body, action, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-dashed border-gray-200 py-14 px-6 text-center ${className}`}>
        <div className="w-14 h-14 rounded-2xl bg-mint text-primary mx-auto flex items-center justify-center text-2xl">
            {icon}
        </div>
        {title && <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>}
        {body && <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">{body}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
);

export default EmptyState;
