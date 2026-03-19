import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import './services/cron.js';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
connectDB().then(()=>{
  server.listen(PORT, ()=> console.log(`Server running on ${PORT}`));
}).catch((err)=>{
  console.error('DB connection failed', err);
  process.exit(1);
});
