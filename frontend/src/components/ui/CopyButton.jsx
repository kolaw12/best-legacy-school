import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import { useToast } from './ToastProvider';

/**
 * Tiny copy-to-clipboard button. Shows a quick "Copied!" check, plus toasts.
 *
 * <CopyButton value={inv.invoice_no} label="invoice number" />
 * <CopyButton value={text}>Copy details</CopyButton>
 */
const CopyButton = ({ value, label = 'value', children, className = '', size = 'sm' }) => {
    const [copied, setCopied] = useState(false);
    const toast = useToast();

    const onClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(true);
            toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} copied`);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Could not copy — long-press to copy manually');
        }
    };

    const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

    return (
        <button
            onClick={onClick}
            aria-label={`Copy ${label}`}
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary transition-colors ${sizeClass} ${className}`}
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="inline-flex items-center gap-1 text-primary">
                        <Check className="w-3 h-3" strokeWidth={3} />
                        Copied
                    </motion.span>
                ) : (
                    <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="inline-flex items-center gap-1">
                        <Copy className="w-3 h-3" strokeWidth={2} />
                        {children || 'Copy'}
                    </motion.span>
                )}
            </AnimatePresence>
        </button>
    );
};

export default CopyButton;
