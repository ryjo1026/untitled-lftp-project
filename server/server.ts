import express, { Express, Request, Response } from 'express';
import * as path from 'path';
import Controller from './controller/controller';
import index from './routes/index';

export default class Server {
  private app: Express;

  constructor(app: Express) {
    this.app = app;

    new Controller({});

    this.app.use(express.static(path.resolve('./') + '/dist/static'));
    this.app.use('/', index);
  }

  public start(port: number | string): void {
    this.app.listen(port, () =>
      console.log(`Server listening on port: ${port}`),
    );
  }
}
