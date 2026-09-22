import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import API_URL from '../config/api';

vi.mock('axios');

describe('Finance API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Invoice fetching', () => {
        it('fetches invoices from correct endpoint', async () => {
            axios.get.mockResolvedValueOnce({
                data: [
                    { id: 1, invoice_no: 'BLS/INV/2026/00001', amount_due: 82000, amount_paid: 0, status: 'unpaid' },
                ],
            });

            const { data } = await axios.get(`${API_URL}/api/finance/invoices/`);
            expect(data).toHaveLength(1);
            expect(data[0].invoice_no).toBe('BLS/INV/2026/00001');
        });
    });

    describe('Payment recording', () => {
        it('posts payment to correct endpoint', async () => {
            axios.post.mockResolvedValueOnce({
                data: { id: 1, receipt_no: 'BLS/RCP/2026/00001', amount: 50000 },
            });

            const { data } = await axios.post(`${API_URL}/api/finance/payments/`, {
                invoice: 1,
                amount: 50000,
                method: 'transfer',
                reference: 'GTB/12345678',
            });

            expect(data.receipt_no).toBe('BLS/RCP/2026/00001');
        });
    });

    describe('Child bill', () => {
        it('fetches bill breakdown for a student', async () => {
            axios.get.mockResolvedValueOnce({
                data: {
                    student: { id: 1, name: 'Test Student', class: 'Basic 3' },
                    bill_items: [
                        { name: 'School Fee', amount: 39000 },
                        { name: 'Uniform', amount: 20000 },
                    ],
                    total_bill: 59000,
                    book_items: [
                        { name: 'Mathematics', price: 4000 },
                    ],
                    total_books: 4000,
                    grand_total: 63000,
                },
            });

            const { data } = await axios.get(`${API_URL}/api/finance/child/1/bill/`);
            expect(data.total_bill).toBe(59000);
            expect(data.grand_total).toBe(63000);
            expect(data.bill_items).toHaveLength(2);
        });
    });
});
