const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 12;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty', 'admin'], default: 'student' },
    isVerified: { type: Boolean, default: false },
    // TOTP MFA
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, select: false },
    mfaPendingSecret: { type: String, select: false }
}, { timestamps: true });

userSchema.statics.isBcryptHash = (value) => BCRYPT_HASH.test(value || '');

// Always store passwords as salted bcrypt hashes
userSchema.pre('save', async function hashPassword() {
    if (!this.isModified('password') || BCRYPT_HASH.test(this.password)) return;
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
});

module.exports = mongoose.model('User', userSchema);
