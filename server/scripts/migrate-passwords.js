// Hashes any plain-text passwords; existing hashes are skipped.
// Usage: MONGO_DB_NAME=college_events_hub_da3 node scripts/migrate-passwords.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/college_events_hub';

const migrate = async () => {
    await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
    console.log(`Connected to MongoDB (database: ${mongoose.connection.name})`);

    const users = await User.find({}, 'email password');
    const plain = users.filter((u) => !User.isBcryptHash(u.password));
    console.log(`Users: ${users.length}, already hashed: ${users.length - plain.length}, plain text: ${plain.length}`);

    for (const user of plain) {
        user.markModified('password');
        await user.save();
        console.log(`  hashed password for ${user.email}`);
    }

    await mongoose.disconnect();
};

migrate().catch((err) => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
