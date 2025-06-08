import React from 'react';
import ReactDOM from 'react-dom/client';

const App: React.FC = () => (
  <div>
    <h1>Street Collector Customer Portal</h1>
    <p>Deployment Test</p>
  </div>
);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 