import React from "react";
import { ErrorPage } from "@/pages/ErrorPage";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service like Sentry here
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    // Optional: Refresh page or navigate gracefully
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return this.props.children;
  }
}
