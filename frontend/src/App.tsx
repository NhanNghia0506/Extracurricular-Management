import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import MainLayout from './layouts/MainLayout/mainlayout';
import Feed from './layouts/components/Feed/feed';
import CreateActivity from './components/CreateActivity/create.activity';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/create-activity" element={<CreateActivity />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
