import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('axios');

// A minimal probe component so we can exercise the hook through the provider
// (the tests below care about observable state, not implementation details).
function Probe() {
    const { isAuthenticated, role, login } = useAuth();
    return (
        <div>
            <div data-testid="auth-state">{isAuthenticated ? `in:${role}` : 'out'}</div>
            <button onClick={() => login('real.user', 'hunter2')}>login-real-user</button>
            <button onClick={() => login('admin', 'admin123').catch(() => {})}>login-with-old-demo-creds</button>
        </div>
    );
}

const renderProbe = () =>
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>
    );

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        delete axios.defaults?.headers?.common?.Authorization;
    });

    it('starts logged out with no stored token', () => {
        renderProbe();
        expect(screen.getByTestId('auth-state')).toHaveTextContent('out');
    });

    it('no longer has a client-side shortcut for the old demo credentials — everything goes through the API', async () => {
        axios.post.mockRejectedValueOnce({ response: { data: { non_field_errors: ['Invalid username or password.'] } } });
        renderProbe();
        await act(async () => {
            screen.getByText('login-with-old-demo-creds').click();
        });
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/login/'),
            { username: 'admin', password: 'admin123' }
        );
        expect(screen.getByTestId('auth-state')).toHaveTextContent('out');
    });

    it('a real login posts credentials to /api/auth/login/ and stores the returned token', async () => {
        axios.post.mockResolvedValueOnce({
            data: { token: 'real-token-123', profile: { role: 'teacher', username: 'real.user' } },
        });
        // Logging in sets a new token, which re-triggers the /auth/me/ verification
        // effect for that token — stub it so the effect doesn't throw on the mock.
        axios.get.mockResolvedValue({ data: { role: 'teacher', username: 'real.user' } });
        renderProbe();
        await act(async () => {
            screen.getByText('login-real-user').click();
        });
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/api/auth/login/'),
            { username: 'real.user', password: 'hunter2' }
        );
        expect(screen.getByTestId('auth-state')).toHaveTextContent('in:teacher');
        expect(localStorage.getItem('bls_auth_token')).toBe('real-token-123');
    });
});
