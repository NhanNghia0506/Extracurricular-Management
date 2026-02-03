import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import MainLayout from './layouts/MainLayout/mainlayout';
import Feed from './layouts/components/Feed/feed';
import CreateActivity from './components/CreateActivity/create.activity';
import LoginPage from './pages/LoginPage';
import WithSidebarLayout from './layouts/WithSidebarLayout/withsidebarlayout';
import Attendance from './components/Attendance/attendance';
import ActivityDetail from './components/ActivityDetail/activity.detail';

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

        <Route element={<WithSidebarLayout />}>
          <Route path="/attendance" element={<Attendance/>} />
          <Route path="/detail/:id" element={<ActivityDetail />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
