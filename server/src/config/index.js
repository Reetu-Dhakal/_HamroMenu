import dotenv from 'dotenv';

dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hamromenu',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'hamromenu_access_secret_dev',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'hamromenu_refresh_secret_dev',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  esewa: {
    merchantId: process.env.ESEWA_MERCHANT_ID || '',
    secretKey: process.env.ESEWA_SECRET_KEY || '',
    environment: process.env.ESEWA_ENVIRONMENT || 'sandbox',
    productCode: process.env.ESEWA_PRODUCT_CODE || '',
  },
  khalti: {
    publicKey: process.env.KHALTI_PUBLIC_KEY || '',
    secretKey: process.env.KHALTI_SECRET_KEY || '',
    environment: process.env.KHALTI_ENVIRONMENT || 'sandbox',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '',
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:5000',
};

export default config;
