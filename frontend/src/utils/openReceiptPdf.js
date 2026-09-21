import API_URL from '../config/api';

/**
 * Fetch a receipt PDF with auth headers and open in a new tab.
 * Without auth, the endpoint returns 401.
 */
export async function openReceiptPdf(paymentId) {
    const token = localStorage.getItem('token');
    const url = `${API_URL}/api/finance/payments/${paymentId}/receipt/`;
    try {
        const res = await fetch(url, {
            headers: token ? { Authorization: `Token ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    } catch (err) {
        console.error('Failed to load receipt PDF:', err);
        window.open(url, '_blank');
    }
}
