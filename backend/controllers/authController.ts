import { Request, Response } from 'express';
import User from '../models/User';
import { sendOTPEmail } from '../utils/mailer';
import { generateToken } from '../utils/generateToken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOTP = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  let user = await User.findOne({ email });
  if (user) {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.name = name;
    await user.save();
  } else {
    user = await User.create({ email, name, otp, otpExpiry });
  }

  await sendOTPEmail(email, otp);
  res.status(200).json({ message: 'OTP sent to email' });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || !user.otpExpiry || new Date() > user.otpExpiry)
    return res.status(400).json({ error: 'Invalid or expired OTP' });

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  const token = generateToken((user as any)._id.toString());
  res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
};

export const googleLogin = async (req: Request, res: Response) => {
  const { tokenId } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) return res.status(400).json({ error: 'Invalid Google token' });

  const { sub: googleId, email, name } = payload;

  let user = await User.findOne({ email }) as typeof User.prototype | null;
  if (!user) {
    user = await User.create({ email, name, googleId }) as typeof User.prototype;
  } else {
    user.googleId = googleId;
    await user.save();
  }

  const token = generateToken(user._id.toString());
  res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
};
