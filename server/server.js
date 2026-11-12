require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

console.log('JWT loaded?', !!process.env.JWT_SECRET);

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://buy-sell-barter.onrender.com', 'https://buy-sell-barter.site.je'], 
  credentials: true 
}));


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected to:', mongoose.connection.name))
  .catch(e => console.error('❌ MongoDB FAILED:', e.message));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/goods', require('./routes/goods'));
app.use('/api/profile', require('./routes/profile')); 
app.use('/api/reviews', require('./routes/reviews')); 
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/transactions', require('./routes/transactions'));

// Serve frontend
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on http://0.0.0.0:${PORT}`));