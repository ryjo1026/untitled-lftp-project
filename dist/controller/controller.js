"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var scanner_1 = require("./scanner");
var lftp_1 = __importDefault(require("./lftp"));
var Controller = (function () {
    function Controller(context) {
        this.context = context;
        this.lftp = new lftp_1.default();
        this.remoteScanner = new scanner_1.RemoteScanner();
        this.localScanner = new scanner_1.LocalScanner();
        this.lftpScanner = new scanner_1.LFTPScanner();
        this.bootstrap();
    }
    Controller.prototype.bootstrap = function () {
        console.log('Bootstrapping controller');
        this.remoteScanner.bootstrap();
        this.localScanner.bootstrap();
        this.lftpScanner.bootstrap();
    };
    return Controller;
}());
exports.default = Controller;
//# sourceMappingURL=controller.js.map