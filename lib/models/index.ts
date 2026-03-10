// Import all models to ensure they're registered with mongoose
import User from './User';
import Job from './Job';
import Payment from './Payment';
import Invoice from './Invoice';
import Chat from './Chat';
import Team from './Team';
import Rating from './Rating';
import AuditLog from './AuditLog';
import Inventory from './Inventory';

// Export them for convenience
export { User, Job, Payment, Invoice, Chat, Team, Rating, AuditLog, Inventory };