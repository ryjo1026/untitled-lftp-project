import express from 'express';

import Controller from './controller/controller';
import index from './routes/index';

new Controller({});
const app = express();

app.use('/', index);

app.listen(process.env.PORT || 8000);
