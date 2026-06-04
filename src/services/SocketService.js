// Frontend/frontend/admin/src/services/SocketService.js
import { WS_URL } from '../config';

class SocketService {
    constructor() {
        this.ws = null;
        this.subscribers = new Set();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
        this.isConnecting = false;
        this.messageQueue = [];
    }

    connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        if (this.isConnecting) return;
        this.isConnecting = true;

        console.log(`[Socket] Connecting to ${WS_URL}...`);
        
        try {
            this.ws = new WebSocket(WS_URL);

            this.ws.onopen = () => {
                console.log('[Socket] Connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.flushQueue();
                this.notifySubscribers({ type: 'socket:connected' });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.notifySubscribers(data);
                } catch (e) {
                    console.error('[Socket] Message parse error:', e);
                }
            };

            this.ws.onclose = () => {
                console.log('[Socket] Disconnected');
                this.isConnecting = false;
                this.notifySubscribers({ type: 'socket:disconnected' });
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error('[Socket] Error:', error);
                this.isConnecting = false;
            };
        } catch (e) {
            console.error('[Socket] Connection failed:', e);
            this.isConnecting = false;
            this.attemptReconnect();
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[Socket] Reconnecting attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        } else {
            console.error('[Socket] Max reconnect attempts reached');
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(data) {
        this.subscribers.forEach(callback => callback(data));
    }

    send(data) {
        const message = JSON.stringify(data);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        } else {
            console.warn('[Socket] Not connected, queuing message:', data.type);
            this.messageQueue.push(message);
            this.connect(); // Ensure we try to connect
        }
    }

    flushQueue() {
        while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(this.messageQueue.shift());
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.onclose = null; // Prevent reconnect
            this.ws.close();
            this.ws = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
