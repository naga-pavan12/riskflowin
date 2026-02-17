import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface Props {
    children?: ReactNode;
    componentName?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary] Uncaught error in ${this.props.componentName || 'Component'}:`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Component Error</AlertTitle>
                        <AlertDescription>
                            Something went wrong in <strong>{this.props.componentName || 'this component'}</strong>.
                            <br />
                            <code className="text-xs bg-black/10 p-1 rounded mt-2 block overflow-x-auto">
                                {this.state.error?.message}
                            </code>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}
