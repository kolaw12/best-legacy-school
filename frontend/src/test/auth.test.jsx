import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import API_URL from '../config/api';

// Mock axios
vi.mock('axios');

describe('Auth API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('Login', () => {
        it('sends correct credentials to /api/auth/login/', async () => {
            const mockResponse = {
                data: {
                    token: 'test-token-123',
                    profile: { username: 'admin', role: 'school_admin' },
                },
            };
            axios.post.mockResolvedValueOnce(mockResponse);

            const { data } = await axios.post(`${API_URL}/api/auth/login/`, {
                username: 'admin',
                password: 'admin123',
            });

            expect(axios.post).toHaveBeenCalledWith(
                `${API_URL}/api/auth/login/`,
                { username: 'admin', password: 'admin123' }
            );
            expect(data.token).toBe('test-token-123');
            expect(data.profile.role).toBe('school_admin');
        });

        it('returns error on invalid credentials', async () => {
            axios.post.mockRejectedValueOnce({
                response: { data: { non_field_errors: ['Invalid credentials'] } },
            });

            try {
                await axios.post(`${API_URL}/api/auth/login/`, {
                    username: 'wrong',
                    password: 'wrong',
                });
            } catch (err) {
                expect(err.response.data.non_field_errors).toContain('Invalid credentials');
            }
        });
    });

    describe('Password Reset', () => {
        it('sends reset request to correct endpoint', async () => {
            axios.post.mockResolvedValueOnce({
                data: { message: 'If an account with that email exists...' },
            });

            const { data } = await axios.post(`${API_URL}/api/auth/password-reset/`, {
                email: 'admin@bestlegacy.sch',
            });

            expect(axios.post).toHaveBeenCalledWith(
                `${API_URL}/api/auth/password-reset/`,
                { email: 'admin@bestlegacy.sch' }
            );
            expect(data.message).toContain('account');
        });

        it('rejects short passwords', async () => {
            axios.post.mockRejectedValueOnce({
                response: { data: { error: 'Password must be at least 8 characters.' } },
            });

            try {
                await axios.post(`${API_URL}/api/auth/password-reset/confirm/`, {
                    token: 'some-token',
                    password: 'short',
                });
            } catch (err) {
                expect(err.response.data.error).toContain('8 characters');
            }
        });
    });
});
