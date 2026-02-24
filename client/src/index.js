import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext.jsx';

import { BrowserRouter as Router } from "react-router-dom"

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
);
