import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import Fine from '../models/Fine.js';
import dayjs from 'dayjs';

export const summary = async (_req,res,next)=>{
  try {
    const [resources, users, reservations, fines] = await Promise.all([
      Resource.aggregate([{ $group:{ _id:'$resourceType', count:{ $sum:1 }, qty:{ $sum:'$quantity' } } }]),
      User.countDocuments(),
      Reservation.find(),
      Fine.countDocuments({ paid:false })
    ]);
    const counts = { books:0, laptop:0, projector:0, projector_screen:0, users, pending:0, overdue:0, active:0, finesUnpaid:fines };
    resources.forEach(r=>{ counts[r._id]=r.count; });
    reservations.forEach(r=>{
      if (r.status==='pending') counts.pending++;
      if (r.status==='overdue') counts.overdue++;
      if (r.status==='borrowed' || r.status==='approved') counts.active++;
    });

    // monthly reservations last 6 months
    const sixMonthsAgo = dayjs().subtract(5,'month').startOf('month').toDate();
    const monthlyAgg = await Reservation.aggregate([
      { $match:{ createdAt:{ $gte: sixMonthsAgo } }},
      { $group:{ _id:{ m:{ $month:'$createdAt' }, y:{ $year:'$createdAt' } }, count:{ $sum:1 } } },
      { $sort:{ '_id.y':1, '_id.m':1 } }
    ]);
    const monthly = monthlyAgg.map(m=>({ label:`${m._id.m}/${String(m._id.y).slice(2)}`, value:m.count }));

    // popular resources by reservation count
    const popularAgg = await Reservation.aggregate([
      { $group:{ _id:'$resource', count:{ $sum:1 } } },
      { $sort:{ count:-1 } },
      { $limit:5 },
      { $lookup:{ from:'resources', localField:'_id', foreignField:'_id', as:'res' } },
      { $unwind:'$res' }
    ]);
    const popular = popularAgg.map(p=>({ title:p.res.title, count:p.count }));

    res.json({ counts, monthly, popular });
  } catch(e){ next(e); }
};
