"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var controller_1 = __importDefault(require("./controller/controller"));
var index_1 = __importDefault(require("./routes/index"));
new controller_1.default({});
var app = express_1.default();
app.use('/', index_1.default);
app.listen(process.env.PORT || 8000);
//# sourceMappingURL=app.js.map