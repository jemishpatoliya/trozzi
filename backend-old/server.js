const app = require('./app');

const PORT = process.env.PORT || 5050;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TROZZY Backend Server running on port ${PORT}`);
    console.log(`📊 MongoDB Atlas connected`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
