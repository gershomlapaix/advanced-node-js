const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const User = require('./userModel');

// tour schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour name must not be empty'],
      unique: true, // no more same names
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 max chars',
      ],
      minlength: [
        10,
        'A tour name must have greater than or equal to 40 max chars',
      ],
      // validate: [validator.isAlpha,"The name must contain only characters"],
    },

    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have maximum group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have diffiyculty field'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy: medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating must be above 1.0'],
      max: [5, 'rating must be less than or equal to 5.0'],
      set: (val) => Math.random(val * 10) / 10,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    price: {
      type: Number,
      required: true,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // "this" points to the current document only. it cannot work on update
          return val < this.price;
          100 < 200;
        },
        message: `Discount price ({VALUE}) should be below the regular price`,
      },
    },
    summary: {
      type: String,
      // trim: true,
      required: true,
    },
    description: {
      type: String,
      // trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'imageCover field is required'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number], // latitude && longitude
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], // latitude && longitude
        address: String,
        description: String,
      },
    ],
    // guides: Array,
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// indexes
// tourSchema.index({ price: 1});
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// virtual properties(business logic example)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// 1. document middlewares: runs before  .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // "this" points to the current document
  next();
});

// Embedding the documents
tourSchema.pre('save', async function (next) {
  const guidesPromises = await this.guides.map(
    async (id) => await User.findById(id)
  );

  this.guides = await Promise.all(guidesPromises);

  next();
});

/*
tourSchema.post('save', function (doc, next) {
  console.log(doc);
  next();
});

tourSchema.post('save', function (doc, next) {
  // no more access to this keyword
  console.log(doc);
  next();
});

 */

// 2. query middlewares
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); // "this" points to the current query

  next();
});

// populate the guides before returning the data
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangedAt' });

  next();
});
// 3. aggregate middlwares
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // "this" points to the aggregation object
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
