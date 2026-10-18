// Main DOM mounting entry point for the DriftSmith React application.
// Imports index.css styles and mounts App component to the DOM.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
