// npm run seed: empties the database and loads the demo data
import { config } from '../config.js';
import { connectDb, disconnectDb } from '../db.js';
import { DEMO_PASSWORD, demoUsers } from './demoData.js';
import { seedDemoData } from './seed.js';

await connectDb(config.MONGODB_URI);
const counts = await seedDemoData();
await disconnectDb();

console.log(
	`Added ${counts.users} users, ${counts.restaurants} restaurants and ${counts.orders} orders.`,
);
console.log(`Demo logins (password "${DEMO_PASSWORD}"):`);
for (const user of demoUsers) {
	console.log(`  ${user.role.padEnd(8)} ${user.email}`);
}
