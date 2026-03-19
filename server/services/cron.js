import cron from 'node-cron';
import { markOverdue, remindDueSoon } from './reservationService.js';

// Run immediately on boot
(async()=>{
  try {
    await remindDueSoon();
    await markOverdue();
  } catch (e) {
    console.error('startup cron error', e);
  }
})();

// Hourly checks
cron.schedule('0 * * * *', () => {
  remindDueSoon().catch((e)=>console.error('cron due soon error', e));
  markOverdue().catch((e)=>console.error('cron overdue error', e));
});
