var mongoose = require('mongoose');

// Step 0: Remember to add your MongoDB information in one of the following ways!
var connect = process.env.MONGODB_URI || require('./connect');

mongoose.connect(connect);


var userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String
  }
});


userSchema.methods.getFollows = function (callback){
  Follow.find({'to': this._id})
  .populate('from')
  .exec(function(err, allFollowers) {
    Follow.find({'from': this._id})
    .populate('to')
    .exec(function(err, allFollowing) {
      callback(allFollowers, allFollowing)
    })
  })
}

userSchema.methods.follow = function (idToFollow, callback){
  var follow =  new mongoose.models.Follow({
    'from': this._id,
    'to': idToFollow
  });
  console.log(follow);
  console.log('follow')
  follow.save(callback);
}

// app.get('/follow/:otherUserId', function(req, res) {
//   req.user.follow(function(err, hlkh) {
//
//   })
// })


userSchema.methods.unfollow = function (idToUnfollow, callback){
    Follow.remove({
      'from': this._id,
      'to': idToUnfollow
    }, callback)
}

userSchema.methods.isFollowing = function(idToFollow, callback) {
  Follow.find({'to': idToFollow, 'from': this._id}, function(err, follow) {
    if (follow.length !== 0) {callback(true);}
    else {callback(false);}
  })
}

userSchema.methods.getReviews = function(callback) {
  Review.find({'userId': this._id})
  .populate('restaurantId')
  .exec(function(err, reviews) {
    console.log(reviews);
    callback(err, reviews)
  })
}

var FollowsSchema = mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

var Follow = mongoose.model('Follow', FollowsSchema)

var reviewSchema = mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  stars: {
    type: Number,
    required: true
    // the number of stars (1-5)
  },
  restaurantId:{
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

var restaurantSchema = mongoose.Schema({
  name: {
    type: String,
    required: true，
    index: true
  },
  category: {
    type: String,
    enums: [
      "Mexican", "Food Stands", "Tex-Mex", "Food Trucks", "Pizza", "Bars", "Italian", "Mediterranean", "Indian", "Grocery"
    ],
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
    // on a scale of 1-3
  },
  openTime: {
    type: Number,
    required: true
    // an hour of opening time (assume Eastern Time, UTC-4) between 0-23
  },
  closeTime: {
    type: Number,
    required: true
    // an hour of closing time between 0-23
  },
  totalScore: {
    type: Number
  },
  reviewScore: {
    type: Number
  },
  averageRating: {
    type: Number，
    index: true
  }

});

var Review = mongoose.model('Review', reviewSchema)

restaurantSchema.methods.getReviews = function (restaurantId, callback){
  Review.find({'restaurantId': restaurantId})
  .populate('userId')
  .exec(function(err, reviews) {
    console.log("fetching restaurant reviews", reviews);
    callback(err, reviews)
  })
}

// restaurantSchema.virtual('averageRating').get(function(){
//   return this.totalScore/this.reviewScore;
//   Review.find({'restaurantId': this._id}, function(err, review) {
//     return review.totalScore/review.reviewScore;
//   })
//   //   function(err, reviews){
//   //   reviews.forEach(function(review) {
//   //     totalScore += review['stars'];
//   //     reviewCount ++;
//   //   })
//   // })
//   // return totalScore/reviewScore
// })
//
// restaurantSchema.methods.stars = function(callback){
//
// }


restaurantSchema.statics.getTen = function(page, callback) {
  Restaurant.find()
  .limit(10)
  .skip(10*(page-1))
  .exec(callback)
}

var Restaurant = mongoose.model('Restaurant', restaurantSchema)

module.exports = {
  User: mongoose.model('User', userSchema),
  Restaurant: mongoose.model('Restaurant', restaurantSchema),
  Review: mongoose.model('Review', reviewSchema),
  Follow: mongoose.model('Follow', FollowsSchema)
};
