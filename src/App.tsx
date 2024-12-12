import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';
import { ReactFlowProvider } from '@xyflow/react';
import GraphProvider from './context/GraphProvider';
import TestContext from './context/TestContext';


const App: React.FC = () => {
  console.log('App mounting...');
  return (
    <Provider store={store}>
<ReactFlowProvider>
        <GraphProvider>
          <TestContext />
          <div className="min-h-screen bg-gray-950 text-white">
            <DashboardLayout />
          </div>
          <TestContext />
        </GraphProvider>
      </ReactFlowProvider>  
    
    </Provider>
  );
};

export default App;