import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';

import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-900 text-white">
        <DashboardLayout />
 
      </div>
    </Provider>
  );
};

export default App; 

