import socketio from 'socket.io'

class Socket {
  initialize(server) {
    this.socket = socketio(server, {
      path: '/queue',
    })
    this.socket.on('connection', () => {
      console.log('Queue monitor connected')
    })
  }

  added(id) {
    if (this.socket) {
      this.socket.emit('job.added', id, {for: 'everyone'})
    }
  }

  updated(id) {
    if (this.socket) {
      this.socket.emit('job.updated', id, {for: 'everyone'})
    }
  }
}

export const socket = process.queue_socket = process.queue_socket || new Socket()
