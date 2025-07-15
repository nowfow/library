import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import filesRouter from './routes/files.js';
import termsRouter from './routes/terms.js';
import worksRouter from './routes/works.js';
import authRouter from './routes/auth.js';
import collectionsRouter from './routes/collections.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/files', filesRouter);
app.use('/api/terms', termsRouter);
app.use('/api/works', worksRouter);
app.use('/api/auth', authRouter);
app.use('/api/collections', collectionsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 