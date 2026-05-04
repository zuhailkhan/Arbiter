import { Request, Response, NextFunction } from 'express';
import Logging from '../library/Logging';
import User from '../models/UserModel';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '30d';
const ACCESS_COOKIE_AGE = 15 * 60 * 1000;
const REFRESH_COOKIE_AGE = 30 * 24 * 60 * 60 * 1000;

function makeJti() {
    return Math.floor(Math.random() * 1_000_000);
}

const Login = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        return res.status(400).json({ message: 'Please provide username or email' });
    }
    if (!password) {
        return res.status(400).json({ message: 'Please provide password' });
    }

    try {
        const user = await User.findOne({ $or: [{ username }, { email }] });
        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(403).json({ message: 'Incorrect Password' });
        }

        const payload = { username: user.username, email: user.email, roles: user.roles, jti: makeJti() };
        const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET as string, { expiresIn: ACCESS_EXPIRY });
        const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET as string, { expiresIn: REFRESH_EXPIRY });

        res.cookie('accessToken', accessToken, { httpOnly: true, maxAge: ACCESS_COOKIE_AGE });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: REFRESH_COOKIE_AGE });

        Logging.log(`${user.username} logged in`);
        return res.status(200).json({ status: true, user: payload });
    } catch (error: any) {
        Logging.error(error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

const Register = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Invalid Request, Please check the fields' });
    }

    try {
        const exists = await User.countDocuments({ $or: [{ username }, { email }] });
        if (exists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hash });
        await newUser.save();

        Logging.log('New user created');
        return res.status(201).json({ message: 'User created successfully' });
    } catch (error: any) {
        Logging.error(error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
};

const reValidate = (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(403).json({ message: 'Unauthorized | No Refresh Token' });
    }

    try {
        const decoded = jwt.verify(refreshToken as string, process.env.REFRESH_SECRET as string) as {
            username: string; email: string; roles: string[];
        };

        const newPayload = { username: decoded.username, email: decoded.email, roles: decoded.roles, jti: makeJti() };
        const newAccessToken = jwt.sign(newPayload, process.env.ACCESS_SECRET as string, { expiresIn: ACCESS_EXPIRY });

        res.cookie('accessToken', newAccessToken, { httpOnly: true, maxAge: ACCESS_COOKIE_AGE });
        return res.status(201).json(newPayload);
    } catch (err) {
        Logging.error('Refresh Token Invalid');
        return res.status(403).json({ message: 'Unauthorized | Invalid Refresh Token' });
    }
};

const Logout = async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('accessToken', { httpOnly: true });
    res.clearCookie('refreshToken', { httpOnly: true });
    return res.status(200).json({ status: true, message: 'Logout Successful' });
};

const verifyLogin = (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized | No Access Token' });
    }

    try {
        const decoded = jwt.verify(accessToken as string, process.env.ACCESS_SECRET as string);
        if (decoded) {
            return res.status(200).json({ status: true, message: 'User Authorized' });
        }
    } catch (err) {
        Logging.error(`Access Token Invalid: ${err}`);
        return res.status(403).json({ message: 'Unauthorized | Invalid Access Token' });
    }
};

export default { Login, Register, reValidate, Logout, verifyLogin };
