const mongoose = require('mongoose');

const connectDB = async () => {
  let uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/autoflow';
  
  if (uri.includes('<db_password>')) {
    console.warn('\n⚠️ WARNING: Your MONGO_URI in .env still contains the placeholder <db_password>!');
    console.warn('👉 Please replace <db_password> with your actual MongoDB Atlas user password in backend/.env\n');
    uri = 'mongodb://127.0.0.1:27017/autoflow';
  }

  // Mask credentials for clean logging
  const maskedUri = uri.replace(/\/\/(.*):(.*)@/, '//$1:****@');

  try {
    console.log(`Connecting to MongoDB (${maskedUri})...`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (Database: ${conn.connection.name})`);
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    console.error('Make sure your MONGO_URI in .env is correct and IP 0.0.0.0/0 is allowed in MongoDB Atlas Network Access.');
    process.exit(1);
  }
};

module.exports = connectDB;
