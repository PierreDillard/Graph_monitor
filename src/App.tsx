import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import DashboardLayout from './components/layout/DashboardLayout';
import { Toaster } from './components/ui/toaster';
import './index.css';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-gray-950 text-white">
        <DashboardLayout />
        <Toaster />
      </div>
    </Provider>
  );
};

export default App;
