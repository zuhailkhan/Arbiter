import express, { Application, Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import { dbconnect } from './config/db.connect';
import Logging from './library/Logging';
import UserRoute from './routes/UserRoute';
import ChatRoute from './routes/ChatRoute';
import authenticator from './middlewares/authenticator';
import cookieParser from 'cookie-parser';
import './config/config';  // validates required env vars at startup

const app: Application = express();

const corsOptions: CorsOptions = {
    origin: [process.env.CLIENT_ORIGIN ?? 'http://localhost:8014'],
    methods: 'GET,POST',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
    Logging.info(`${req.method} ${req.url} — ${req.socket.remoteAddress}`);
    res.on('finish', () => {
        Logging.info(`${req.method} ${req.url} — ${res.statusCode}`);
    });
    next();
});

app.use('/User', UserRoute);
app.use('/Chat', ChatRoute);

app.post('/ping', authenticator, (req: Request, res: Response) => {
    res.send('pong');
});

const PORT = process.env.PORT ?? 8013;

const startServer = async () => {
    try {
        await dbconnect();
    } catch (error) {
        Logging.error(error);
    } finally {
        app.listen(PORT, () => {
            Logging.log(`Server is running on port ${PORT}`);
        });
    }
};

startServer();
