import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';

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

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
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
    </Provider>
  );
};

export default App;
