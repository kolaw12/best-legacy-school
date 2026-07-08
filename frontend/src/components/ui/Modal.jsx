import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, subtitle, children, footer, size = 'md' }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose?.();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl' };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className={`bg-white rounded-3xl shadow-card-lg w-full ${widths[size]} max-h-[90vh] flex flex-col overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-black text-ink">{title}</h2>
                        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-2 -m-2 text-gray-400 hover:text-ink rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" strokeWidth={2} />
                    </button>
                </header>
                <div className="flex-1 overflow-y-auto px-6 py-6" data-lenis-prevent>{children}</div>
                {footer && <footer className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">{footer}</footer>}
            </div>
        </div>
    );
};

export default Modal;
