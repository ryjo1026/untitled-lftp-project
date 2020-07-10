import Server from './Server';
import express from 'express';
const app = express();

const server = new Server(app);
server.start(process.env.PORT || 8000);
