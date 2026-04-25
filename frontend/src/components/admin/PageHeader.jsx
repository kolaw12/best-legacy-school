const AdminPageHeader = ({ title, subtitle, actions }) => (
    <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-gray-500 max-w-2xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </header>
);

export default AdminPageHeader;
