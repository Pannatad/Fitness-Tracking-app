import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-black text-white p-8 font-mono overflow-auto">
                    <h1 className="text-3xl text-red-500 font-bold mb-4">Something went wrong.</h1>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-red-900 mb-4">
                        <h2 className="text-xl font-bold mb-2 text-red-400">Error:</h2>
                        <pre className="whitespace-pre-wrap text-sm text-red-200">
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <h2 className="text-xl font-bold mb-2 text-zinc-400">Component Stack:</h2>
                        <pre className="whitespace-pre-wrap text-xs text-zinc-500">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
