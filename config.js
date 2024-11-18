
import "dotenv/config";

const config = {
    BASE_URL: process.env.BASE_URL,
    BASE_KEY: process.env.BASE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET
};
export default config;
