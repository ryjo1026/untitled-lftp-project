import express from 'express';
import Server from './server';

const app = express();

const server = new Server(app);
server.start(process.env.PORT || 8000);
