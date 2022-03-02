const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  // OPTIONS
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.pre(/^find/, function (next) {
  // V1

  //   this.populate({ path: 'tour', select: 'name' }).populate({
  //     path: 'user',
  //     select: 'name photo',
  //   });

  //  V2

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // avoid duplicate reviews

// static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // this: points to the whole model
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// call the above static function
reviewSchema.post('save', function (next) {
  // this: points to the current review
  this.constructor.calcAverageRatings(this.tour);
});

// ////////////////////////////////////////////////////////
// findByIdAndUpdate
// findByIdAndDelete
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  // console.log(this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

// ////////////////////////////////////////////////////////

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
