const express = require ('express');
const List = require ('../models/List');
const verifyToken = require ('../middleware/verifyToken');

const router = express.Router ();

//Created
router.post ('/', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    const newList = new List (req.body);
    try {
      const saveList = await newList.save ();

      res.status (201).json (saveList);
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not allowed to  access');
  }
});

router.delete ('/:id', verifyToken, async (req, res) => {
  if (req.user.isAdmin) {
    try {
      await List.findByIdAndDelete (req.params.id);
      res.status (200).json ('List is deleted');
    } catch (error) {
      res.status (500).json (error);
    }
  } else {
    res.status (403).json ('You are not allowed');
  }
});

//getAll movie

router.get ('/', verifyToken, async (req, res) => {
  const typeQuery = req.query.type;
  const genreQuery = req.query.genre;
  let list = [];
  try {
    if (typeQuery) {
      if (genreQuery) {
        list = await List.aggregate ([
          {
            $sample: {
              size: 10,
            },
          },
          {
            $match: {
              type: typeQuery,
              genre: genreQuery,
            },
          },
        ]);
      } else {
        list = await List.aggregate ([
          {
            $sample: {
              size: 10,
            },
          },
          {
            $match: {
              type: typeQuery,
            },
          },
        ]);
      }
    } else {
      list = await List.aggregate ([
        {
          $sample: {
            size: 10,
          },
        },
      ]);
    }
    res.status (200).json (list);
  } catch (error) {
    return res.status (500).json (error);
  }
});

//getSpecificList

router.get ('/:id', verifyToken, async (req, res) => {
  try {
    const list = await List.findById (req.params.id);
    res.status (200).json (list);
  } catch (error) {
    return res.status (500).json (error);
  }
});

module.exports = router;
