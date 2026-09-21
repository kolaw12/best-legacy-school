import { MessageCircle } from 'lucide-react';

/**
 * Share content via WhatsApp. Works on mobile (opens app) and desktop (web.whatsapp.com).
 *
 * <WhatsAppShare text="My child's report card is ready!" url="https://blds.com.ng/portal/..." />
 */
const WhatsAppShare = ({ text, url, className = '' }) => {
    const encoded = encodeURIComponent(`${text}\n\n${url || ''}`.trim());
    const href = `https://wa.me/?text=${encoded}`;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1da851] transition ${className}`}
        >
            <MessageCircle className="w-4 h-4" />
            Share on WhatsApp
        </a>
    );
};

export default WhatsAppShare;
