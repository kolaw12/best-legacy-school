import { Component } from 'react';

/**
 * Catches uncaught render errors anywhere in the tree and shows a friendly
 * fallback instead of a blank white screen.
 *
 * Uses a plain <a> tag instead of react-router-dom <Link> because the
 * ErrorBoundary may be mounted outside the Router context.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info?.componentStack);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen bg-bg flex items-center justify-center p-6">
                <div className="bg-white rounded-3xl shadow-card-lg p-8 max-w-lg w-full text-center">
                    <div className="w-14 h-14 rounded-2xl bg-secondary-soft text-secondary mx-auto flex items-center justify-center text-2xl">!</div>
                    <h1 className="mt-5 text-2xl font-black text-ink">Something broke on our end.</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        We've logged the error. You can try again, or head back home — your data is safe.
                    </p>
                    {this.state.error?.message && (
                        <pre className="mt-4 text-[11px] text-rose-700 bg-rose-50 rounded-xl p-3 text-left overflow-x-auto">
                            {String(this.state.error.message).slice(0, 240)}
                        </pre>
                    )}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        <button
                            onClick={this.reset}
                            className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-full shadow-sm transition"
                        >
                            Try again
                        </button>
                        <a
                            href="/"
                            className="bg-white text-ink border border-gray-200 hover:border-primary hover:text-primary font-semibold px-5 py-2.5 rounded-full transition"
                        >
                            ← Back to home
                        </a>
                    </div>
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
