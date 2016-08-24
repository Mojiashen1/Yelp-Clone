var express = require('express');
var router = express.Router();
var models = require('../models/models');
var User = models.User;
var Follow = models.Follow;
var Restaurant = models.Restaurant;
var Review = models.Review;

// Geocoding - uncomment these lines when the README prompts you to!
var NodeGeocoder = require('node-geocoder');
var geocoder = NodeGeocoder({
  provider: "google",
  apiKey: process.env.GEOCODING_API_KEY || "AIzaSyCvBHI3R5b_fpI4JcvbxyY0YmI7fm4Tbnc",
  httpAdapter: "https",
  formatter: null
});

// THE WALL - anything routes below this are protected!
router.use(function(req, res, next){
  if (!req.user) {
    res.redirect('/login');
  } else {
    return next();
  }
});

router.get('/singleProfile/:id', function(req, res) {
  User.findById(req.params.id, function(err, user) {
    console.log(err);
    console.log(user);
    if(err) {
      res.send(err);
    }
    else {
      user.getFollows(function(followers, followings) {
        user.getReviews(function(err, reviews) {
          res.render('singleProfile', {
              allFollowers: followers,
              allFollowings: followings,
              name: user.name,
              location: user.location,
              userid: user._id,
              reviews: reviews
          })
        })
      })
    }
  })
})
  // req.user.getFollowers(function(followers, followings) {
  //   res.render('singleProfile', {
  //       allFollowers: followers,
  //       allFollowings: followings
//     })
//   })
// })

router.get('/profiles', function(req, res) {
  User.find(function(err, users) {
    res.render('profiles', {
      users: users,
      length: users.length
    })
  })
})

router.get('/following/:id', function(req, res) {
  // am I following the person?
  req.user.isFollowing(req.params.id, function(iAmFollowing) {
    if (iAmFollowing) {
      // if yes, unfollow
      res.send('already followed')
    } else {
      // if not, follow
      req.user.follow(req.params.id, function(err, follow) {
        res.redirect('/singleProfile/' + follow.to)
      })
    }
  })
})

router.get('/restaurants', function(req, res) {
  Restaurant.find(function(err, restaurants) {
    res.render('restaurants', {
      restaurants: restaurants
    })
  })
})

router.get('/restaurants/list/:x', function(req, res) {
  var page = parseInt(req.params.x || 1);
  Restaurant.getTen(page, function(restaurants) {
    res.render('restaurants', {
      restaurants: restaurants,
      prev: page - 1,
      next : page + 1,
      pages: [page, page + 1, page +2, page + 3, page + 4]
    })
  })
})


router.get('/restaurants/new', function(req, res) {
  res.render('newRestaurant');
})

router.get('/restaurants/:id', function(req, res) {
    Restaurant.findById(req.params.id, function(err, restaurant) {
      // Review.find({'restaurantId': req.params.id}, function(err, reviews){
      restaurant.getReviews(req.params.id, function(err, reviews) {
        // User.find({'userId': reviews.userId}, function(err, user) {
        console.log("reviews", reviews)
          res.render('singleRestaurant', {
            name: restaurant.name,
            price: restaurant.price,
            totalScore: restaurant.totalScore,
            reviewCount: restaurant.reviewCount,
            open: restaurant.openTime,
            close: restaurant.closeTime,
            latitude: restaurant.latitude,
            longitude: restaurant.longitude,
            reviews: reviews
        })
        // })
      })
    })
})


router.post('/restaurants/new', function(req, res, next) {
  geocoder.geocode(req.body.address, function(err, data) {
    console.log(err);
    console.log(data);
    var latitude = data[0].latitude;
    var longitude = data[0].longitude;
    var restaurant =  new Restaurant({
      'name': req.body.name,
      'category': req.body.category,
      'price': parseInt(req.body.price),
      'latitude': latitude,
      'longitude': longitude,
      'openTime': parseInt(req.body.open),
      'closeTime': parseInt(req.body.close),
      'totalScore': 0,
      'reviewCount': 0,
      'averageRating': 0
    })
    restaurant.save(function(err, restaurant) {
      res.redirect('/restaurants')
    })
  });
});

router.get('/reviews/:id/new', function(req, res) {
  Restaurant.findById(req.params.id, function(err, restaurant) {
    res.render('newReview', {
      name: restaurant.name
    });
  })
})

router.post('/reviews/:id/new', function(req, res) {
  var review = new Review({
    'content': req.body.content,
    'stars': req.body.stars,
    'restaurantId': req.params.id,
    'userId': req.user._id
  })
  review.save(function(err, review) {
    console.log(err)
    console.log(review);
    Restaurant.findByIdAndUpdate(review.restaurantId, {
      $inc: {
        'totalScore': review.stars,
        'reviewCount': 1
      }
    }, function(err, restaurant) {
      restaurant.averageRating = restaurant.totalScore / restaurant.reviewCount;
      restaurant.save()
      res.redirect('/restaurants')
    })
  })
})


module.exports = router;
