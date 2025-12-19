import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
                    <div className="max-w-md w-full text-center space-y-4">
                        <div className="bg-destructive/10 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            An error occurred while rendering the application.
                        </p>
                        <div className="bg-muted p-4 rounded-md text-left overflow-auto max-h-48 text-sm font-mono border border-border">
                            {this.state.error?.toString()}
                        </div>
                        <Button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                        >
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
