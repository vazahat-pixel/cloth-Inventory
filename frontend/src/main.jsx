import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { CssBaseline, ThemeProvider } from '@mui/material';
import App from './App';
import theme from './theme';
import { store } from './app/store';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationProvider';
import { LoadingProvider } from './context/LoadingProvider';
import { ConfirmProvider } from './context/ConfirmProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <NotificationProvider>
              <LoadingProvider>
                <ConfirmProvider>
                  <CssBaseline />
                  <App />
                </ConfirmProvider>
              </LoadingProvider>
            </NotificationProvider>
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>,
);
