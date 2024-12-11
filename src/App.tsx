import React, { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import DashboardLayout from './components/layout/DashboardLayout';
import './index.css';
import Graph from './services/Graph';
import { GraphContext } from './context/GraphContext';

const App: React.FC = () => {
  console.log('App mounting...');
  const graphRef = useRef<Graph | null>(null);

  useEffect(() => {
    graphRef.current = new Graph({ type: 'websocket', address: 'ws://127.0.0.1:17815/rmt' });
    graphRef.current.connect();

    return () => {
      if (graphRef.current) {
        graphRef.current.disconnect();
      }
    };
  }, []);

  return (
    <Provider store={store}>
      <GraphContext.Provider value={{ graph: graphRef.current }}>
        <div className="min-h-screen bg-gray-950 text-white">
          <DashboardLayout />
        </div>
      </GraphContext.Provider>
    </Provider>
  );
};

export default App;
