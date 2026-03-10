import { connectDB } from '../lib/mongodb';
import Job from '../lib/models/Job';

(async () => {
  try {
    await connectDB();
    const jobs = await Job.find({}).lean();
    console.log('jobs count', jobs.length);
    console.dir(jobs, { depth: 1 });
  } catch (e) {
    console.error('error', e);
  } finally {
    process.exit(0);
  }
})();
