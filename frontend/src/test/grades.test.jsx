import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import API_URL from '../config/api';

vi.mock('axios');

describe('Grades API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Grade fetching', () => {
        it('fetches grades for a class and subject', async () => {
            axios.get.mockResolvedValueOnce({
                data: [
                    { id: 1, student: 1, student_name: 'Test Student', ca1: 15, ca2: 18, exam: 45, total: 78, grade: 'B', remark: 'Very Good' },
                ],
            });

            const { data } = await axios.get(`${API_URL}/api/academics/grades/`, {
                params: { class_level: 1, subject: 1 },
            });
            expect(data).toHaveLength(1);
            expect(data[0].total).toBe(78);
        });
    });

    describe('Bulk grade save', () => {
        it('saves multiple grades at once', async () => {
            axios.post.mockResolvedValueOnce({
                data: { saved: 3, errors: [] },
            });

            const { data } = await axios.post(`${API_URL}/api/academics/grades/bulk_save/`, {
                class_level: 1,
                subject: 1,
                term: 1,
                grades: [
                    { student: 1, ca1: 15, ca2: 18, exam: 45 },
                    { student: 2, ca1: 12, ca2: 14, exam: 40 },
                    { student: 3, ca1: 18, ca2: 19, exam: 55 },
                ],
            });

            expect(data.saved).toBe(3);
            expect(data.errors).toHaveLength(0);
        });
    });
});
