import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import AppRoutes from './routes/AppRoutes';
import { ToastProvider } from './contexts/ToastContext';
import NotificationSystem from './components/NotificationSystem/notification.system';
import { socketService } from './services/socket.service';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Kết nối WebSocket khi app khởi động
    socketService.connect();

    // Lắng nghe message từ server
    socketService.on('receive-message', (data) => {
      console.log('📩 Message from server:', data);
    });

    // Cleanup khi unmount
    return () => {
      socketService.off('receive-message');
      socketService.disconnect();
    };
  }, []);

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
