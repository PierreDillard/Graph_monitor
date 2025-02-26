import { DataViewReader } from '../DataViewReader';

export const messageProcessor = {
  processJsonMessage(dataView: DataView, service: any): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      console.log('[MessageProcessor] JSON message received:', text);
      const data = JSON.parse(text);
      this.processGpacMessage(data, service);
    } catch (error) {
      console.error('[MessageProcessor] JSON parsing error:', error);
    }
  },

  processConiMessage(dataView: DataView, service: any): void {
    try {
      const reader = new DataViewReader(dataView, 4);
      const text = reader.getText();
      if (text.startsWith('json:')) {
        const jsonText = text.slice(5);
        const data = JSON.parse(jsonText);
        this.processGpacMessage(data, service);
      }
    } catch (error) {
      console.error('[MessageProcessor] CONI message parsing error:', error);
    }
  },

  processDefaultMessage(dataView: DataView, service: any): void {
    try {
      const text = new TextDecoder().decode(dataView.buffer);
      if (text.startsWith('{')) {
        const data = JSON.parse(text);
        this.processGpacMessage(data, service);
      }
    } catch (error) {
      console.error('[MessageProcessor] Default message parsing error:', error);
    }
  },

  processGpacMessage(data: any, service: any): void {
    console.log('[MessageProcessor] Processing message:', data);
    if (!data.message) {
      console.warn('[MessageProcessor] Received message without type:', data);
      return;
    }
    switch (data.message) {
      case 'filters':
        service.handleFiltersMessage(data);
        break;
      case 'update':
        service.handleUpdateMessage(data);
        break;
      case 'details':
        service.handleDetailsMessage(data);
        break;
      default:
        console.log('[MessageProcessor] Unknown message type:', data.message);
    }
  },
};
