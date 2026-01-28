import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import MainLayout from './layouts/MainLayout/mainlayout';
import Feed from './layouts/components/Feed/feed';
import CreateActivity from './components/CreateActivity/create.activity';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Login không dùng layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes dùng MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Feed />} />
          <Route path="/create-activity" element={<CreateActivity />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
