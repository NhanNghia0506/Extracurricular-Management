import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './contexts/ToastContext';
import NotificationSystem from './components/NotificationSystem/notification.system';

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppRoutes />
        <NotificationSystem />
      </Router>
    </ToastProvider>
  );
}

export default App;
