/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves Provider, Helmet, theme, route, session, error, toast, and fly-to-cart wrapper order.
 * - Adds React Query cache provider only around existing API consumers; no endpoints, payloads, or auth logic changed.
 * - Existing route-level lazy loading and Suspense fallback remain active for all customer/admin pages.
 */
import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store } from './store/store';
import theme from './theme/theme';
import AppRoutes from './routes/AppRoutes';
import { FlyToCartProvider } from './components/common/FlyToCartAnimation';
import Loading from './components/common/Loading';
import GlobalLoadingBar from './components/common/GlobalLoadingBar';
import SessionManager from './components/common/SessionManager';
import ErrorBoundary from './components/common/ErrorBoundary';
import ApiErrorNotifier from './components/common/ApiErrorNotifier';
import { ToastProvider } from './components/common/ToastProvider';
import SiteHead from './components/common/SiteHead';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SiteHead />
            <GlobalLoadingBar />
            <SessionManager />
            <ApiErrorNotifier />
            <ErrorBoundary>
              <ToastProvider>
                <BrowserRouter>
                  <Suspense fallback={<Loading message="Loading page..." />}>
                    <FlyToCartProvider>
                      <AppRoutes />
                    </FlyToCartProvider>
                  </Suspense>
                </BrowserRouter>
              </ToastProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
