import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongod: MongoMemoryServer | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    let uri = env.MONGODB_URI;

    if (!uri) {
      console.log('⚡ Initializing in-memory MongoDB Server for zero-config local development...');
      mongod = await MongoMemoryServer.create({
        binary: { version: '7.0.3' },
      });
      uri = mongod.getUri();
      console.log(`📦 In-memory MongoDB running at: ${uri}`);
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected successfully to: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // If standard URI failed and we are in development, try falling back to memory server
    if (!mongod && env.NODE_ENV === 'development') {
      console.log('🔄 Attempting fallback to MongoMemoryServer...');
      try {
        mongod = await MongoMemoryServer.create({
          binary: { version: '7.0.3' },
        });
        const fallbackUri = mongod.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`✅ Fallback In-memory MongoDB Connected: ${fallbackUri}`);
        return;
      } catch (fallbackErr) {
        console.error('❌ Fallback MongoDB Connection failed:', fallbackErr);
      }
    }
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
