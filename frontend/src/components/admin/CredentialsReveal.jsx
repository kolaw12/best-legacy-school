import { AlertTriangle } from 'lucide-react';
import CopyButton from '../ui/CopyButton';

const Row = ({ label, value }) => (
    <div className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
        <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{label}</div>
            <div className="font-mono text-sm text-ink truncate">{value}</div>
        </div>
        <CopyButton value={value} label={label.toLowerCase()} />
    </div>
);

/**
 * Shows a just-generated username/password once, with copy buttons. The
 * credentials email is fire-and-forget with no delivery guarantee, so this
 * is the only reliable place an admin can see (and relay) the password.
 */
const CredentialsReveal = ({ username, password }) => (
    <div className="space-y-3">
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-xs text-amber-800 leading-relaxed">
                Shown once — this password can't be retrieved again after you close this window. Copy it now and relay it securely.
            </p>
        </div>
        <div className="space-y-2">
            <Row label="Username" value={username} />
            <Row label="Password" value={password} />
        </div>
    </div>
);

export default CredentialsReveal;
