

import { jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MultiFilterMonitor from '../../../components/widgets/MultiFilterMonitor';
import { gpacWebSocket } from '../../../services/gpacWebSocket';
import { mockFilterData, mockProcessingMetrics } from '../../../__mock__/filterData';





// Create mock store
const mockStore = configureStore([]);

// Mock the WebSocket service
jest.mock('../../../services/gpacWebSocket', () => ({
  gpacWebSocket: {
    unsubscribeFromFilter: jest.fn(),
    getCurrentFilterId: jest.fn(),
    setCurrentFilterId: jest.fn(),
  },
}));

describe('MultiFilterMonitor', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    store = mockStore({
      multiFilter: {
        selectedFilters: [
          { id: '1', nodeData: mockFilterData[0] },
          { id: '2', nodeData: mockFilterData[1] },
        ],
      },
      graph: {
        isLoading: false,
      },
      filterMonitoring: {
        realtimeMetrics: {
          '1': mockProcessingMetrics[0],
          '2': mockProcessingMetrics[1],
        },
      },
    });
  });



  // Test interactions
  describe('Interactions', () => {
    it('should close monitor when clicking close button', async () => {
      render(
        <Provider store={store}>
          <MultiFilterMonitor id="test" title="Test Monitor"/>
        </Provider>
      );

      const closeButtons = screen.getAllByTitle('Stop monitoring this filter');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(gpacWebSocket.unsubscribeFromFilter).toHaveBeenCalledWith('1');
      });
    });
  });

  // Test data updates
  describe('Data Updates', () => {
    it('should update metrics when new data arrives', () => {
      const { rerender } = render(
        <Provider store={store}>
          <MultiFilterMonitor id="test" title="Test Monitor" />
        </Provider>
      );

      // Update store with new metrics
      const newStore = mockStore({
        ...store.getState() as object,
        filterMonitoring: {
          realtimeMetrics: {
            '1': { ...mockProcessingMetrics[0], processingRate: 15.5 },
          },
        },
      });

      rerender(
        <Provider store={newStore}>
          <MultiFilterMonitor id="test" title="Test Monitor" />
        </Provider>
      );

      expect(screen.getByText('15.50 MB/s')).toBeInTheDocument();
    });
  });
});

// Mock data validation tests
describe('Data Validation', () => {
  // Test input data validation
  it('should validate input filter data', () => {
    const invalidFilter = {
      ...mockFilterData[0],
      bytes_done: 'invalid', // Should be a number
    };

    expect(() => validateFilterData(invalidFilter)).toThrow();
  });

  // Test metrics validation
  it('should validate processing metrics', () => {
    const invalidMetrics = {
      ...mockProcessingMetrics[0],
      bufferStatus: {
        current: 'invalid', // Should be a number
        total: 100,
      },
    };

    expect(() => validateProcessingMetrics(invalidMetrics)).toThrow();
  });

  // Test edge cases
  it('should handle edge cases gracefully', () => {
    const edgeCaseFilter = {
      ...mockFilterData[0],
      bytes_done: 0,
      buffer: -1,
    };

    expect(validateFilterData(edgeCaseFilter)).toBeTruthy();
  });
});

// Performance tests
describe('Performance', () => {
  let store: ReturnType<typeof mockStore>;

  beforeEach(() => {
    store = mockStore({
      multiFilter: {
        selectedFilters: [
          { id: '1', nodeData: mockFilterData[0] },
          { id: '2', nodeData: mockFilterData[1] },
        ],
      },
      graph: {
        isLoading: false,
      },
      filterMonitoring: {
        realtimeMetrics: {
          '1': mockProcessingMetrics[0],
          '2': mockProcessingMetrics[1],
        },
      },
    });
  });

  it('should handle rapid updates efficiently', async () => {
    const { rerender } = render(
      <Provider store={store}>
        <MultiFilterMonitor id="test" title="Test Monitor" />
      </Provider>
    );

    const startTime = performance.now();
    
    // Simulate 100 rapid updates
    for (let i = 0; i < 100; i++) {
      const newStore = mockStore({
        ...(store.getState() as object),
        filterMonitoring: {
          realtimeMetrics: {
            '1': { ...mockProcessingMetrics[0], processingRate: i },
          },
        },
      });

      rerender(
        <Provider store={newStore}>
          <MultiFilterMonitor id="test" title="Test Monitor" />
        </Provider>
      );
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Updates should process in less than 1 second
    expect(duration).toBeLessThan(1000);
  });
});

// Helper functions for validation
function validateFilterData(filter: any) {
  if (typeof filter.bytes_done !== 'number') {
    throw new Error('bytes_done must be a number');
  }
  
  // Add more validation as needed
  return true;
}

function validateProcessingMetrics(metrics: any) {
  if (typeof metrics.bufferStatus?.current !== 'number') {
    throw new Error('buffer metrics must be numbers');
  }
  
  // Add more validation as needed
  return true;
}