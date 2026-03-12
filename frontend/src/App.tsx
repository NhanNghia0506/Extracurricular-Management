import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './contexts/ToastContext';
import NotificationSystem from './components/NotificationSystem/notification.system';
import NotificationRealtimeBridge from './components/NotificationSystem/notification.realtime';

function App() {
  return (
    <ToastProvider>
      <Router>
        <AppRoutes />
        <NotificationRealtimeBridge />
        <NotificationSystem />
      </Router>
    </ToastProvider>
  );
}

export default App;
