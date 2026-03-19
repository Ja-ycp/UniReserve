import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';
import dotenv from 'dotenv';
import { globalLimiter } from './config/rateLimit.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { audit } from './middleware/audit.js';

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(globalLimiter);
app.use(audit);
app.use('/api', routes);
app.use(errors());
app.use(errorHandler);

export default app;
