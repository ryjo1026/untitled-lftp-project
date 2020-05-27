"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalScanner = exports.LFTPScanner = exports.RemoteScanner = void 0;
var Scanner = (function () {
    function Scanner() {
    }
    return Scanner;
}());
var RemoteScanner = (function (_super) {
    __extends(RemoteScanner, _super);
    function RemoteScanner() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RemoteScanner.prototype.bootstrap = function () { };
    return RemoteScanner;
}(Scanner));
exports.RemoteScanner = RemoteScanner;
var LFTPScanner = (function (_super) {
    __extends(LFTPScanner, _super);
    function LFTPScanner() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LFTPScanner.prototype.bootstrap = function () { };
    return LFTPScanner;
}(Scanner));
exports.LFTPScanner = LFTPScanner;
var LocalScanner = (function (_super) {
    __extends(LocalScanner, _super);
    function LocalScanner() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LocalScanner.prototype.bootstrap = function () { };
    return LocalScanner;
}(Scanner));
exports.LocalScanner = LocalScanner;
//# sourceMappingURL=scanner.js.map