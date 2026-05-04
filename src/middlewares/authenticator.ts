import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import Logging from '../library/Logging';

const authenticator = (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(accessToken as string, process.env.ACCESS_SECRET as string, (err, user) => {
        if (user) {
            Logging.info('User Validated');
            return next();
        }

        // Access token invalid — fall back to refresh token
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        jwt.verify(refreshToken as string, process.env.REFRESH_SECRET as string, (refreshErr, refreshUser) => {
            if (refreshErr || !refreshUser) {
                Logging.error('Refresh Token Invalid');
                return res.status(403).json({ message: 'Invalid Refresh Token' });
            }
            Logging.info('User Validated via Refresh Token');
            return next();
        });
    });
};

export default authenticator;
