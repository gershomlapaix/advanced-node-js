const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Review = require('./../models/reviewModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`connection is on`);
  });


const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours,{ validateBeforeSave: false }); // can also hold arrays
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews,{ validateBeforeSave: false });
    console.log(`Data successfully loaded`);
  } catch (error) {
    console.error(error);
  }
  process.exit();
};

const deleteAllDbData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log(`Data deleted`);
  } catch (error) {
    console.error(error);
  }
  process.exit();
};

if (process.argv[2] === '--delete') {
  deleteAllDbData();
} else if (process.argv[2] === '--import') {
  importData();
}
