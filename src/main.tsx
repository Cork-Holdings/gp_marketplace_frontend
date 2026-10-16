import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/lib/context/auth';
import App from './App';
import { ActionFeedback } from '@/components/common/ActionFeedback';
import './index.css';
import './components/common/workflow-visuals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <ActionFeedback />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
