const OTP = require('../models/OTP');
const { sendOtpMail } = require('./email');

const createOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Replaces any previous code for the same email + purpose and mails the new one
const issueOtp = async (email, purpose) => {
    const code = createOtpCode();
    await OTP.deleteMany({ email, purpose });
    await OTP.create({ email, code, purpose });
    await sendOtpMail(email, code, purpose);
};

// Returns true and consumes the code if it is valid
const consumeOtp = async (email, code, purpose) => {
    const record = await OTP.findOne({ email, code: String(code || ''), purpose });
    if (!record) return false;
    await OTP.deleteOne({ _id: record._id });
    return true;
};

module.exports = { issueOtp, consumeOtp };
