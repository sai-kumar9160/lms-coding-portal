import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import './dashboard.css';
import { App } from './App';

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
