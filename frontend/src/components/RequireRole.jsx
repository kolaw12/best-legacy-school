import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Gate children behind authentication + optional role check.
 * `roles` is an array of allowed roles; if empty, any authenticated user passes.
 */
const RequireRole = ({ roles = [], children }) => {
    const { isAuthenticated, role, booting } = useAuth();
    const location = useLocation();

    if (booting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="text-gray-400 text-sm">Verifying session…</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin-login" state={{ from: location.pathname }} replace />;
    }

    if (roles.length && !roles.includes(role)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg p-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md text-center shadow-card">
                    <div className="w-12 h-12 rounded-full bg-secondary-soft text-secondary mx-auto flex items-center justify-center text-2xl">!</div>
                    <h2 className="mt-4 text-xl font-black text-ink">Access restricted</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Your role ({role || 'unknown'}) can't open this area. Ask a school admin if you think this is a mistake.
                    </p>
                    <a href="/" className="inline-block mt-5 text-sm font-semibold text-primary hover:underline">Back to website</a>
                </div>
            </div>
        );
    }

    return children;
};

export default RequireRole;
