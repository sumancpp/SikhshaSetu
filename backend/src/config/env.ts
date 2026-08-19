import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().optional().default(''),
  JWT_SECRET: z.string().default('e8f1c50e41b9d45371c69f20ba8b6289df713f02e604f8db08466b0a8809e5c1'),
  JWT_REFRESH_SECRET: z.string().default('c36d299fb58f96e451372cf0175b9e075c32890632b7e5a6f238dfcae60f2529'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  FRONTEND_URL: z.string().default('https://sikhshasetu-frontend.onrender.com'),
  ADMIN_EMAIL: z.string().email().default('admin@shikshasetu.edu'),
  ADMIN_PASSWORD: z.string().default('Admin@123456'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  
  // Email Configuration
  EMAIL_SERVICE: z.string().default('gmail'),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASS: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  RESEND_FROM: z.string().default('onboarding@resend.dev'),

  // Cloudinary Cloud Storage
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.string().default('25'),

  // AI & Multi-Model LLM Services
  GEMINI_API_KEY: z.string().default(''),
  GOOGLE_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GROQ_API_KEY: z.string().default(''),
  AI_BASE_URL: z.string().default(''),
});

export const env = envSchema.parse(process.env);
