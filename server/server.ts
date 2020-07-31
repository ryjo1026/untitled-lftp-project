import express, { Express, Request, Response } from 'express';
import * as path from 'path';
import Controller from './controller/controller';
import index from './routes/index';
import logger from './common/logger';

export default class Server {
  private app: Express;

  constructor(app: Express) {
    this.app = app;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const controller = new Controller();

    this.app.use('/static', express.static(`${path.resolve('.')}/dist/static`));
    this.app.use('/', index);
  }

  public start(port: number | string): void {
    this.app.listen(port, () =>
      logger.info(`Server listening on port: ${port}`),
    );
  }
}
