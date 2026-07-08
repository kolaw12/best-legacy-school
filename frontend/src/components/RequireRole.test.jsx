import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RequireRole from './RequireRole';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

const renderGuarded = (roles) =>
    render(
        <MemoryRouter initialEntries={['/admin']}>
            <Routes>
                <Route path="/admin-login" element={<div>Login page</div>} />
                <Route
                    path="/admin"
                    element={
                        <RequireRole roles={roles}>
                            <div>Protected content</div>
                        </RequireRole>
                    }
                />
            </Routes>
        </MemoryRouter>
    );

describe('RequireRole', () => {
    it('shows a loading state while the session is still being verified', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, role: undefined, booting: true });
        renderGuarded([]);
        expect(screen.getByText(/verifying session/i)).toBeInTheDocument();
    });

    it('redirects to /admin-login when there is no session', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, role: undefined, booting: false });
        renderGuarded([]);
        expect(screen.getByText('Login page')).toBeInTheDocument();
    });

    it('blocks a signed-in user whose role is not in the allowed list', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, role: 'parent', booting: false });
        renderGuarded(['school_admin', 'super_admin']);
        expect(screen.getByText(/access restricted/i)).toBeInTheDocument();
        expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('renders the protected content once role and session both check out', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, role: 'school_admin', booting: false });
        renderGuarded(['school_admin', 'super_admin']);
        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('allows any authenticated user through when no roles are specified', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, role: 'parent', booting: false });
        renderGuarded([]);
        expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
});
