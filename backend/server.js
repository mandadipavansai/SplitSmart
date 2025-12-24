require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));







