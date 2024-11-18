import { DataViewReader } from "./DataViewReader";

type MessageHandler = (connection: WebSocketBase; dataView: DataViewReader) => void;
type ConsoleType = { log: (message: string) => void };

interface MessageHandlers {
  [key: string]: MessageHandler[];
}

export class WebSocketBase {
  private messageHandlers: MessageHandlers = {};
  private socket: WebSocket | null = null;
  private console: ConsoleType | null = null;
  constructor() {
    this.messageHandlers = {};
  }

public setConsole(console: ConsoleType): void {
  this.console = console;
}

public isConnected(): boolean {
  return this.socket !== null;
}

public addConnectHandler(handler: MessageHandler): void { 
 this.addMessageHandler('__Onconnect__', handler);
  }

public addDisconnectHandler(handler: MessageHandler): void {
   this.addMessageHandler('__Ondisconnect__', handler);  
}

public addDefaultMessageHandler(handler: MessageHandler): void {
   this.addMessageHandler('__default__', handler);
}

public addMessageHandler(messageName: string, handler: MessageHandler): void {
  if (!(messageName in this.messageHandlers)) {
    this.messageHandlers[messageName] = [];
  }
  this.messageHandlers[messageName].push(handler);
}

public connect(address: string): void {
  if(this.isConnected()) {
    this.disconnect();
  }

  this.log(`Connecting to ${address}`);
  try {
    this.socket = new WebSocket(address);
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);  
  }catch (error) {
    this.log(`Connection error ${error}`);
  }
}
public disconnect(): void {
  this.log('Disconnecting');
  if(this.isConnected() && this.socket) {
    this.socket.close();
  }
  this.socket = null;
}

public send(msg: string): void {
  if(this.isConnected() && this.socket) {
    this.socket.send(msg);
  }
}
private log(message: string): void {
  if(this.console) {
    this.console.log(message);
  }
} 

private callMessageHandlers(messageName: string, dataView: DataView): void {
  if (messageName in this.messageHandlers) {
    const handlers = this.messageHandlers[messageName];
    handlers.forEach(handler => handler(this, dataView));
  } else if ("__default__" in this.messageHandlers) {
    this.callMessageHandlers("__default__", dataView);
  }
}

private onOpen(event: Event): void {
  this.callMessageHandlers("__OnConnect__", new DataView(new ArrayBuffer(0)));
}

private onClose(event: CloseEvent): void {
  if(this.socket) {
    this.socket.onopen = null;
    this.socket.onmessage = null;
    this.socket.onclose = null;
    this.socket.onerror = null;
    this.socket = null;
  }
  this.callMessageHandlers("__OnDisconnect__", new DataView(new ArrayBuffer(0)));
}

private onError(event: Event): void {
  this.log('Connection error');
}

private onMessage(event: MessageEvent): void {
  const dataView = new DataView(event.data);
  const reader = new DataViewReader(dataView);

  const id = reader.getStringOfLenght(4);
  this.callMessageHandlers(id, dataView);
}
}