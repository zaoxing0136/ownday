import { Component, type ErrorInfo, type ReactNode } from "react";
import { getHomeHref } from "@/lib/navigation";

interface PageErrorBoundaryProps {
  children: ReactNode;
}

interface PageErrorBoundaryState {
  hasError: boolean;
}

export default class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keep the UI recoverable; detailed logging can be added later if needed.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background pb-28">
          <div className="mx-auto max-w-lg px-4 pt-6">
            <div className="rounded-2xl border border-destructive/20 bg-card p-5">
              <p className="text-sm font-semibold">这个页面刚刚出错了</p>
              <p className="mt-2 text-sm text-muted-foreground">
                数据还在，这次先回到安全状态。你可以重试，或者先去别的页面继续用。
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => this.setState({ hasError: false })}
                  className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                >
                  重试当前页
                </button>
                <button
                  onClick={() => window.location.assign(getHomeHref())}
                  className="rounded-lg border px-4 py-3 text-sm font-medium text-foreground"
                >
                  回到今日页
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
