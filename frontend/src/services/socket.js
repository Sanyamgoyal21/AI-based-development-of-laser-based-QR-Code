import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io('http://localhost:8000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  authenticate(userData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', userData);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Real-time event listeners
  onUserUpdated(callback) {
    if (this.socket) {
      this.socket.on('user_updated', callback);
    }
  }

  onUserConnected(callback) {
    if (this.socket) {
      this.socket.on('user_connected', callback);
    }
  }

  onUserDisconnected(callback) {
    if (this.socket) {
      this.socket.on('user_disconnected', callback);
    }
  }

  onQRGenerated(callback) {
    if (this.socket) {
      this.socket.on('qr_generated', callback);
    }
  }

  onQRScanned(callback) {
    if (this.socket) {
      this.socket.on('qr_scanned', callback);
    }
  }

  // Remove specific listeners
  offUserUpdated(callback) {
    if (this.socket) {
      this.socket.off('user_updated', callback);
    }
  }

  offUserConnected(callback) {
    if (this.socket) {
      this.socket.off('user_connected', callback);
    }
  }

  offUserDisconnected(callback) {
    if (this.socket) {
      this.socket.off('user_disconnected', callback);
    }
  }

  offQRGenerated(callback) {
    if (this.socket) {
      this.socket.off('qr_generated', callback);
    }
  }

  offQRScanned(callback) {
    if (this.socket) {
      this.socket.off('qr_scanned', callback);
    }
  }

  // Emit events
  emitUserUpdated(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user_updated', data);
    }
  }

  emitQRGenerated(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('qr_generated', data);
    }
  }

  emitQRScanned(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('qr_scanned', data);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;
