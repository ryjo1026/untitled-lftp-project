import express from 'express';
import index from './routes/index';

const app = express();
app.use('/', index);

app.listen(process.env.PORT || 8000);
