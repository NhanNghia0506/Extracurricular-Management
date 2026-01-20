import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import MainLayout from './layouts/MainLayout/mainlayout';
import Feed from './layouts/components/Feed/feed';

function App() {
  return (
    <div className="App">
      <MainLayout>
        <Feed></Feed>
      </MainLayout>
    </div>
  );
}

export default App;
