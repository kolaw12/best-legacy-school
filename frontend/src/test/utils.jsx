import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/ui/ToastProvider';

/**
 * Custom render that wraps components in all necessary providers.
 */
export function renderWithProviders(ui, options = {}) {
    const Wrapper = ({ children }) => (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );

    return render(ui, { wrapper: Wrapper, ...options });
}

export { render };
