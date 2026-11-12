require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Mongo
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Mongo connected'))
  .catch((e) => console.log('Mongo error:', e));

// Routes
app.use('/api/auth', require('./routes/auth'));

app.get('/', (req, res) => res.send('Buy-Sell-Barter API running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server on', PORT));