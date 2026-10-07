require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vds')
  .then(async () => {
    const p = await Product.findOne({ id: 'exam-bed-sheet-10' });
    console.log("Image: ", p.image);
    console.log("Images: ", p.images);
    process.exit(0);
  });
