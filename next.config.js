/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    EMAIL_SERVICE: process.env.EMAIL_SERVICE,
    APPROVED_DOCTOR_EMAILS: process.env.APPROVED_DOCTOR_EMAILS,
  },
}

module.exports = nextConfig

