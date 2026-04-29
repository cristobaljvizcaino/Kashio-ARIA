
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AriaAuthShell } from './auth/AuthContext';
import LoginGate from './auth/LoginGate';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AriaAuthShell>
      <LoginGate>
        <App />
      </LoginGate>
    </AriaAuthShell>
  </React.StrictMode>
);
