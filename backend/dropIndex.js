const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://dev3brt:dev3@cluster0.vwped.mongodb.net/kripabihariji?retryWrites=true&w=majority&appName=Cluster0');
    console.log('Connected to MongoDB');
    
    const collection = mongoose.connection.collection('payments');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);
    
    // Drop any indexes on paymentId
    try {
      await collection.dropIndex('paymentId_1');
      console.log('Successfully dropped the paymentId index');
    } catch (error) {
      console.log('No paymentId index found or already dropped');
    }
    
    // Drop any unique indexes on paymentId
    try {
      await collection.dropIndex('paymentId_unique');
      console.log('Successfully dropped the unique paymentId index');
    } catch (error) {
      console.log('No unique paymentId index found or already dropped');
    }
    
    // Create a new non-unique index
    await collection.createIndex({ paymentId: 1 }, { 
      sparse: true,
      unique: false,
      background: true
    });
    console.log('Created new non-unique index on paymentId');
    
    // Verify final indexes
    const finalIndexes = await collection.indexes();
    console.log('Final indexes:', finalIndexes);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

dropIndex(); 