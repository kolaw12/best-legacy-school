/**
 * Paystack popup helper.
 *
 * - Loads the Paystack inline script lazily, on first use.
 * - Looks up VITE_PAYSTACK_PUBLIC_KEY at call time. If unset, returns
 *   { ok: false, configured: false } and the caller falls back to the
 *   self-reported transfer flow (which always works).
 *
 * Usage:
 *     import { payInvoice } from '../config/paystack';
 *     const result = await payInvoice({ invoiceId: 12 });
 *     if (result.ok) toast.success(`Receipt ${result.receipt_no}`);
 */
import axios from 'axios';
import API_URL from './api';

const PAYSTACK_INLINE_SRC = 'https://js.paystack.co/v1/inline.js';

let _scriptPromise = null;
const loadPaystackScript = () => {
    if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
    if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
    if (_scriptPromise) return _scriptPromise;

    _scriptPromise = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = PAYSTACK_INLINE_SRC;
        s.async = true;
        s.onload  = () => resolve(window.PaystackPop);
        s.onerror = () => reject(new Error('Could not load Paystack script'));
        document.head.appendChild(s);
    });
    return _scriptPromise;
};

export const isPaystackConfigured = () => Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY);

/**
 * Open the Paystack popup for an invoice.
 * Returns:
 *   { ok: true,  receipt_no, amount }   - paid + verified server-side
 *   { ok: false, reason: 'not-configured' | 'cancelled' | 'failed' | 'verify-failed', detail? }
 */
export async function payInvoice({ invoiceId, amount, email }) {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    if (!publicKey) return { ok: false, reason: 'not-configured' };

    // 1) Backend init: gives us amount + reference + invoice metadata
    let init;
    try {
        const { data } = await axios.post(`${API_URL}/api/finance/paystack/init/`,
            invoiceId ? { invoice: invoiceId, amount } : {});
        init = data;
    } catch (e) {
        return { ok: false, reason: 'init-failed', detail: e.response?.data?.error || e.message };
    }

    // 2) Open inline popup
    let PaystackPop;
    try {
        PaystackPop = await loadPaystackScript();
    } catch (e) {
        return { ok: false, reason: 'script-failed', detail: e.message };
    }

    return new Promise((resolve) => {
        const handler = PaystackPop.setup({
            key: publicKey,
            email,
            amount: Math.round(Number(init.amount) * 100), // kobo
            ref: init.reference,
            currency: 'NGN',
            onClose: () => resolve({ ok: false, reason: 'cancelled' }),
            callback: (response) => {
                // Verify server-side so the Payment row + receipt number get created
                axios.get(`${API_URL}/api/finance/paystack/verify/?reference=${response.reference}`)
                    .then(({ data }) => {
                        if (data.verified) {
                            resolve({ ok: true, receipt_no: data.receipt_no, amount: data.amount });
                        } else {
                            resolve({ ok: false, reason: 'verify-failed', detail: data });
                        }
                    })
                    .catch(e => resolve({ ok: false, reason: 'verify-failed', detail: e.message }));
            },
        });
        handler.openIframe();
    });
}
