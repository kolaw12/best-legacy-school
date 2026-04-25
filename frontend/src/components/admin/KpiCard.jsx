// Token-driven tones. The "sage" tone is now a periwinkle-sage so charts
// stay on-palette after the blue/purple/marigold swap.
const tones = {
    primary: { bg: 'bg-primary-soft',   text: 'text-primary-dark',   accent: 'bg-primary' },
    warm:    { bg: 'bg-secondary-soft', text: 'text-secondary-dark', accent: 'bg-secondary' },
    ink:     { bg: 'bg-gray-100',       text: 'text-ink',            accent: 'bg-ink' },
    sage:    { bg: 'bg-[#EEF0FF]',      text: 'text-[#3D3B8E]',      accent: 'bg-[#A8B4FF]' },
};

const KpiCard = ({ label, value, hint, tone = 'primary', icon, trend }) => {
    const t = tones[tone] || tones.primary;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card hover:shadow-card-lg transition">
            <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl ${t.bg} ${t.text} flex items-center justify-center`}>
                    {icon}
                </div>
                {trend != null && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {trend >= 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <div className="text-3xl font-black text-ink tracking-tight">{value}</div>
                <div className="mt-1 text-sm font-medium text-gray-600">{label}</div>
                {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
            </div>
        </div>
    );
};

export default KpiCard;
