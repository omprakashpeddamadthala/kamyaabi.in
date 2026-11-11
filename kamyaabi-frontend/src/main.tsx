import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/responsive.css';
import { hydrateSelectedProduct, hydrateProductsList } from './features/product/productSlice';
import { store } from './store/store';
import { readBootstrapProduct, readBootstrapProductsList } from './utils/bootstrapData';
import { installGlobalErrorReporter } from './utils/globalErrorReporter';

installGlobalErrorReporter();

const bootstrapProduct = readBootstrapProduct();
if (bootstrapProduct) {
  store.dispatch(hydrateSelectedProduct(bootstrapProduct));
}

const bootstrapProductsList = readBootstrapProductsList();
if (bootstrapProductsList) {
  store.dispatch(hydrateProductsList(bootstrapProductsList));
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
