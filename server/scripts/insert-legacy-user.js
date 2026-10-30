// Demo only: inserts a user with a plain-text password (bypasses the bcrypt hook).
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB_NAME });
    await mongoose.connection.collection('users').insertOne({
        name: 'Legacy Import (old ERP)', email: 'legacy.student@college.edu', password: 'Welcome@2024',
        role: 'student', isVerified: true, mfaEnabled: false, createdAt: new Date(), updatedAt: new Date()
    });
    console.log(`Inserted legacy.student@college.edu with a PLAIN-TEXT password into ${mongoose.connection.name}.users`);
    await mongoose.disconnect();
})();
