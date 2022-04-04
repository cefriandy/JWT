const express = require ('express');
const Users = require ('../models/Users');

const CryptoJs = require ('crypto-js');
const verifyToken = require ('../middleware/verifyToken.js');
const {json} = require ('express');

const router = express.Router ();

//getAll user stats
router.get ('/stats', verifyToken, async (req, res) => {
  //   const today = new Date ();
  //   const lastYear = today.setFullYear (today.setFullYear () - 1);

  const monthsArray = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  try {
    const data = await Users.aggregate ([
      {
        $project: {
          month: {$month: '$createdAt'},
        },
      },
      {
        $group: {
          _id: '$month',
          total: {$sum: 1},
        },
      },
    ]);
    res.status (200).json (data);
  } catch (error) {
    return res.status (500).json (error);
  }
});

// get all data

router.get ('/users', verifyToken, async (req, res) => {
  const query = req.query.limit;
  // console.log (req);
  if (req.user.isAdmin) {
    try {
      const users = query
        ? await Users.find ().limit (query)
        : await Users.find ();
      res.status (200).json (users);
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not admin');
  }
});

// Get
router.get ('/:id', verifyToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      const user = await Users.findById (req.params.id);
      const {password, ...info} = user._doc;

      res.status (200).json (info);
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('User is not found');
  }
});

//Update
router.put ('/:id', verifyToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      req.body.password = CryptoJS.AES
        .encrypt (req.body.password, process.env.SECRET_KEY)
        .toString ();
    }

    try {
      const updateUser = await Users.findByIdAndUpdate (
        req.params.id,
        {
          $set: req.body,
        },
        {$new: true}
      );
      res.status (200).json (updateUser);
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You can only update your account');
  }
});

//Delete
router.delete ('/:id', verifyToken, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await Users.findByIdAndDelete (req.params.id);
      res.status (200).json ('User has been deleted');
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not eligible to delete');
  }
});

module.exports = router;
