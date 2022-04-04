const express = require ('express');
const Movie = require ('../models/Movie');
const verifyToken = require ('../middleware/verifyToken');

const router = express.Router ();

//getSeries
router.get ('/series', verifyToken, async (req, res) => {
  const type = req.query.type;
  let movie;
  try {
    if (type === 'series') {
      movie = await Movie.aggregate ([
        {$match: {isSeries: true}},
        {$sample: {size: 1}},
      ]);
    } else {
      movie = await Movie.aggregate ([
        {$match: {isSeries: false}},
        {$sample: {size: 1}},
      ]);
    }
    res.status (200).json (movie);
  } catch (error) {
    return res.status (500).json (error);
  }
});

//get Data
router.get ('/:id', verifyToken, async (req, res) => {
  try {
    const movies = await Movie.findById (req.params.id);
    res.status (200).json (movies);
  } catch (error) {
    res.status (500).json (error);
  }
});

//get all movie
router.get ('/movies/all', verifyToken, async (req, res) => {
  console.log (req.user);
  if (req.user.isAdmin) {
    try {
      const allMovies = await Movie.find ();
      return res.status (200).json (allMovies.reverse ());
    } catch (error) {
      return res.status (500).json (error);
    }
  } else {
    return res.status (403).json ('You are not allowed');
  }
});

//Create
router.post ('/', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    const newMovie = new Movie (req.body);
    try {
      const savedMovie = await newMovie.save ();

      res.status (201).json (savedMovie);
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not allowed to  access');
  }
});

//update
router.put ('/:id', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      const updateMovie = await Movie.findByIdAndUpdate (
        req.params.id,
        {
          $set: req.body,
        },
        {
          $new: true,
        }
      );
      res.status (200).json (updateMovie);
    } catch (error) {
      return res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not allowed to update');
  }
});

//delete

router.delete ('/:id', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await Movie.findByIdAndDelete (req.params.id);
      res.status (200).json ('Movie is deleted successfully');
    } catch (error) {
      return res.status (500).json (error);
    }
  } else {
    res.status (403).json ('you are not allowed');
  }
});

module.exports = router;
