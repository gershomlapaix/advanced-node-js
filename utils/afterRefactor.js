// // BUILD QUERY ALL THE WAY FROM ABOVE
// const queryObj = { ...req.query };
// const excludedFields = ['page', 'sort', 'limit', 'fields'];
// excludedFields.forEach((el) => delete queryObj[el]);

// filtering 1

// const tours = await Tour.find({duration:5, difficulty:"easy"});

// const tours = await Tour.find()
//   .where('duration')
//   .equals(5)
//   .where('difficulty')
//   .equals('easy');

/////////////////////////////////////////////////////////////////

// Filter 3

// const query = Tour.find(queryObj);

// // EXECUTE THE QUERY
// const tours = await query;

// SEND RESPONSE
//     res.json({ status: 'success', data: { tours: tours } });

/////////////////////////////////////////////////////////////////

// 4 Advanced filtering

// B. 1. Sorting
// if (req.query.sort) {
//   let sortBy = req.query.sort.split(',').join(' ');
//   query = query.sort(sortBy);
// } else {
//   query.sort('-createdAt');
// }

// B 2. Limiting
// if (req.query.fields) {
//   const fields = req.query.fields.split(',').join(' ');
//   query = query.select(fields);
// } else {
//   query = query.select('-__v');
// }

// B 3.Pagination
// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100;
// const skip = (page - 1) * limit;

// query = query.skip(skip).limit(limit);

// /////////////////////////////////////////////////////////////////////////////
