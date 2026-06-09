import { WS_URL } from '../config';
import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.subscribers = new Set();
        this.messageQueue = [];
    }

    connect() {
        if (this.socket) return;
        
        console.log(`[Socket] Connecting to ${WS_URL}/staff...`);
        this.socket = io(`${WS_URL}/staff`);

        this.socket.on('connect', () => {
            console.log('[Socket] Connected');
            this.notifySubscribers({ type: 'socket:connected' });
            
            while(this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                if (msg.type === 'STATUS_CHANGE') {
                    this.socket.emit('status_update', msg.payload);
                }
            }
        });

        this.socket.on('team_status_update', (data) => {
            this.notifySubscribers({ type: 'presence:member:updated', payload: data });
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            this.notifySubscribers({ type: 'socket:disconnected' });
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(data) {
        this.subscribers.forEach(callback => callback(data));
    }

    send(data) {
        if (!this.socket || !this.socket.connected) {
            this.messageQueue.push(data);
            if (!this.socket) this.connect();
        } else {
            if (data.type === 'STATUS_CHANGE') {
                this.socket.emit('status_update', data.payload);
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
