import {EventEmitter2} from 'eventemitter2'

enum State {
  ConnectWhenOnline,
  Connecting,
  Open,
  Closing,
  Closed,
  Failed,
}

export default class Resocket extends EventEmitter2 {

  _url: string

  _proto: string | string[]

  _socket: WebSocket

  _state: State

  _isOnline: boolean = true

  _retry: (any) => boolean = (ev) => {
    return ev.code == 1000
  }

  constructor(url: string, proto: string | string[], retry?: (any) => boolean) {
    super()
    this._url = url
    this._proto = proto

    if(retry) {
      this._retry = retry
    }

    window.addEventListener('online',  () => this.isOnline = true)
    window.addEventListener('offline', () => this.isOnline = false)

    this.open()
  }

  open() {
    this._socket = new WebSocket(this._url, this._proto)

    this._socket.addEventListener('open', this._onOpen.bind(this))
    this._socket.addEventListener('close', this._onClose.bind(this))
    this._socket.addEventListener('error', this._onError.bind(this))
    this._socket.addEventListener('connecting', this._onConnecting.bind(this))
    this._socket.addEventListener('message', this._onMessage.bind(this))
  }

  _onOpen() {
    this._state = State.Open
    this.emit('open')
  }

  _onClose(ev: any) {
    // ignore in case of manual close
    if(this._state == State.Closed || this._state == State.Failed) {
      return
    }

    if(!this._retry(ev)) {
      if(ev.code == 1000) {
        this._state = State.Closed
      } else {
        this._state = State.Failed
      }
      this.emit('close', ev)
      return
    }

    if(!this.isOnline) {
      this._state = State.ConnectWhenOnline
      return
    }

    this.open()
  }

  _onError(ev) {
    this.emit('error', ev)
  }

  _onConnecting(ev) {
    this._state = State.Connecting
    this.emit('connecting', ev)
  }

  _onMessage(ev) {
    this.emit('message', ev)
  }

  /// Close the connection and set status to closed
  close(code?: number, reason?: string) {
    this._state = State.Closed
    this._socket.close(code, reason)
  }

  /// Close the connection and set status to failed
  fail(code?: number, reason?: string) {
    this._state = State.Failed
    this._socket.close(code, reason)
  }

  /// Send data to socket
  send(data: any) {
    this._socket.send(data)
  }

  /// Is true if the connection is open
  get isOpen(): boolean {
    return this._state === State.Open
  }

  /// Is true if the connection is closed (but not failed)
  get isClosed(): boolean {
    return this._state === State.Closed
  }

  /// Is true if the connection is failed (but not closed)
  get isFailed(): boolean {
    return this._state === State.Failed
  }

  set isOnline(isOnline: boolean) {
    if(isOnline && this._state == State.ConnectWhenOnline) {
      this.open()
    }
    this._isOnline = isOnline
  }

  get isOnline(): boolean {
    return this._isOnline
  }
}
