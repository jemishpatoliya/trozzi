const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        console.log(`✅ Database: ${conn.connection.name}`);
        
        // Test connection by pinging
        await mongoose.connection.db.admin().ping();
        console.log('✅ MongoDB Atlas ping successful');
        
        return conn;
    } catch (error) {
        console.error('❌ MongoDB Atlas connection error:', error);
        console.error('❌ Connection string:', process.env.MONGODB_URI ? 'Set' : 'NOT SET');
        process.exit(1);
    }
};

module.exports = connectDB;
