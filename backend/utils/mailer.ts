import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
export const sendOTPEmail = async (email: string, otp: string) => {
  await transporter.sendMail({
    from: `"NoteApp" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your NoteApp OTP',
    html: `<h2>Your OTP is: <strong>${otp}</strong></h2><p>This OTP is valid for 5 minutes.</p>`,
  });
};