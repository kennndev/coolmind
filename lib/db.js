/**
 * MongoDB Database Connection
 * Using Mongoose ODM
 */

import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('✗ MONGODB_URI is not set in environment variables');
      throw new Error('MONGODB_URI environment variable is required');
    }

    cached.promise = mongoose.connect(mongoUri, opts).then((mongoose) => {
      console.log(`✓ MongoDB Connected: ${mongoose.connection.host}`);
      console.log(`✓ Database: ${mongoose.connection.name}`);
      return mongoose;
    }).catch((error) => {
      console.error('✗ MongoDB connection error:', error.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('✗ Failed to connect to MongoDB:', e.message);
    throw e;
  }

  return cached.conn;
}

export default connectDB;

