const mongoose = require('mongoose');
const Job = require('../app/lib/models/Job').default || require('../app/lib/models/Job');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/industry-management';

(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    const jobs = await Job.find({}).lean();
    console.log('jobs count', jobs.length);
    console.dir(jobs, { depth: 1 });
  } catch (e) {
    console.error('error', e);
  } finally {
    mongoose.disconnect();
  }
})();
