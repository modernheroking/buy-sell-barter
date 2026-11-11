require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

console.log('JWT loaded?', !!process.env.JWT_SECRET);
console.log('MONGO:', process.env.MONGO_URI);

app.use(cors({ 
  origin: ['http://localhost:5173', 'https://buy-sell.gt.ct', 'http://buy-sell.gt.ct'], 
  credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected to:', mongoose.connection.name))
  .catch(e => console.error('❌ MongoDB FAILED:', e.message));

app.get('/', (req, res)=>{
  res.send("Hello Api, now working");
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/goods', require('./routes/goods'));
app.use('/api/profile', require('./routes/profile')); 
app.use('/api/reviews', require('./routes/reviews')); 
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/transactions', require('./routes/transactions'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server on http://0.0.0.0:${PORT}`));