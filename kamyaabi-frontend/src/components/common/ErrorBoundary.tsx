import { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';

import { errorApi } from '../../api/errorApi';
import { logger } from '../../utils/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Render-time exception caught by ErrorBoundary', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
    void errorApi.report({
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      source: 'react-error-boundary',
    });
  }

  private readonly handleReload = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            An unexpected error occurred while rendering this page. Please try again;
            if the problem persists, contact support.
          </Typography>
          <Button variant="contained" color="primary" onClick={this.handleReload}>
            Go back home
          </Button>
        </Box>
      </Container>
    );
  }
}

export default ErrorBoundary;
