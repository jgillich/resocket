"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var eventemitter2_1 = require("eventemitter2");
var State;
(function (State) {
    State[State["ConnectWhenOnline"] = 0] = "ConnectWhenOnline";
    State[State["Connecting"] = 1] = "Connecting";
    State[State["Open"] = 2] = "Open";
    State[State["Closing"] = 3] = "Closing";
    State[State["Closed"] = 4] = "Closed";
    State[State["Failed"] = 5] = "Failed";
})(State || (State = {}));
var Resocket = (function (_super) {
    __extends(Resocket, _super);
    function Resocket(url, proto, retry) {
        var _this = _super.call(this) || this;
        _this._isOnline = true;
        _this._retry = function (ev) {
            return ev.code == 1000;
        };
        _this._url = url;
        _this._proto = proto;
        if (retry) {
            _this._retry = retry;
        }
        window.addEventListener('online', function () { return _this.isOnline = true; });
        window.addEventListener('offline', function () { return _this.isOnline = false; });
        _this.open();
        return _this;
    }
    Resocket.prototype.open = function () {
        this._socket = new WebSocket(this._url, this._proto);
        this._socket.addEventListener('open', this._onOpen.bind(this));
        this._socket.addEventListener('close', this._onClose.bind(this));
        this._socket.addEventListener('error', this._onError.bind(this));
        this._socket.addEventListener('connecting', this._onConnecting.bind(this));
        this._socket.addEventListener('message', this._onMessage.bind(this));
    };
    Resocket.prototype._onOpen = function () {
        this._state = State.Open;
        this.emit('open');
    };
    Resocket.prototype._onClose = function (ev) {
        // ignore in case of manual close
        if (this._state == State.Closed || this._state == State.Failed) {
            return;
        }
        if (!this._retry(ev)) {
            if (ev.code == 1000) {
                this._state = State.Closed;
            }
            else {
                this._state = State.Failed;
            }
            this.emit('close', ev);
            return;
        }
        if (!this.isOnline) {
            this._state = State.ConnectWhenOnline;
            return;
        }
        this.open();
    };
    Resocket.prototype._onError = function (ev) {
        this.emit('error', ev);
    };
    Resocket.prototype._onConnecting = function (ev) {
        this._state = State.Connecting;
        this.emit('connecting', ev);
    };
    Resocket.prototype._onMessage = function (ev) {
        this.emit('message', ev);
    };
    /// Close the connection and set status to closed
    Resocket.prototype.close = function (code, reason) {
        this._state = State.Closed;
        this._socket.close(code, reason);
    };
    /// Close the connection and set status to failed
    Resocket.prototype.fail = function (code, reason) {
        this._state = State.Failed;
        this._socket.close(code, reason);
    };
    /// Send data to socket
    Resocket.prototype.send = function (data) {
        this._socket.send(data);
    };
    Object.defineProperty(Resocket.prototype, "isOpen", {
        /// Is true if the connection is open
        get: function () {
            return this._state === State.Open;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resocket.prototype, "isClosed", {
        /// Is true if the connection is closed (but not failed)
        get: function () {
            return this._state === State.Closed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resocket.prototype, "isFailed", {
        /// Is true if the connection is failed (but not closed)
        get: function () {
            return this._state === State.Failed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Resocket.prototype, "isOnline", {
        get: function () {
            return this._isOnline;
        },
        set: function (isOnline) {
            if (isOnline && this._state == State.ConnectWhenOnline) {
                this.open();
            }
            this._isOnline = isOnline;
        },
        enumerable: true,
        configurable: true
    });
    return Resocket;
}(eventemitter2_1.EventEmitter2));
exports.default = Resocket;
