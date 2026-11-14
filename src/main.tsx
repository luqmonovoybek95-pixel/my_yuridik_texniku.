import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeService } from './services/themeService';

// Initialize Theme and Font scale preferences
ThemeService.init();

createRoot(document.getElementById('root')!).render(<App />);
