import dotenv from 'dotenv';

dotenv.config();

const required = ['ACCESS_SECRET', 'REFRESH_SECRET', 'MONGO_USERNAME', 'MONGO_PASSWORD', 'MONGO_CLUSTER'];
for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const MONGO_USERNAME = process.env.MONGO_USERNAME!;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD!;
const MONGO_CLUSTER  = process.env.MONGO_CLUSTER!;
const MONGO_DB       = 'ArbitDB';
const App_Name       = 'arbit-cluster-main';
const MONGO_URL      = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_CLUSTER}/?retryWrites=true&w=majority&appName=${App_Name}`;

export const config = {
    PORT:           process.env.PORT ?? 8013,
    MONGO_URL,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_DB,
};
