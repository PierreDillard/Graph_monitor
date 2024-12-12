// TestContext.jsx
import React, { useContext, useEffect } from 'react';
import { GraphContext } from './GraphContext';

const TestContext = () => {
  const { graph, isConnected, isLoading, error } = useContext(GraphContext);

  useEffect(() => {
    console.log('🔬 [TestContext] GraphContext:', { graph, isConnected, isLoading, error });
  }, [graph, isConnected, isLoading, error]);

  return (
    <div>
      <p>Is Connected: {isConnected.toString()}</p>
      <p>Is Loading: {isLoading.toString()}</p>
      <p>Error: {error}</p>
    </div>
  );
};

export default TestContext;
