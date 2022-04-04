const express = require ('express');
const Users = require ('../models/Users');
const router = express.Router ();
const jwt = require ('jsonwebtoken');
const CryptoJS = require ('crypto-js');

// const bcrypt = require ('bcrypt');

router.post ('/register', async (req, res) => {
  // const {username, email, password} = req.body;

  //   const salt = await bcrypt.genSalt ();
  //   const hasPassword = await bcrypt.hash (req.body.password, salt);

  const newUser = new Users ({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES
      .encrypt (req.body.password, process.env.SECRET_KEY)
      .toString (),
  });

  try {
    const user = await newUser.save ();
    res.status (201).json (user);
  } catch (error) {
    res.status (500).json (error);
  }
});

router.post ('/login', async (req, res) => {
  try {
    const user = await Users.findOne ({
      email: req.body.email,
    });
    if (!user) {
      return res.status (401).json ('Wrong Email or Password');
    }

    const decrypted = CryptoJS.AES.decrypt (
      user.password,
      process.env.SECRET_KEY
    );

    const originalPass = decrypted.toString (CryptoJS.enc.Utf8);

    if (originalPass !== req.body.password) {
      return res.status (401).json ('Wrong Email or Password');
    }

    const accessToken =
      jwt.sign (
        {id: user._id, isAdmin: user.isAdmin},
        process.env.ACCESS_TOKEN,
        {expiresIn: process.env.JWT_LIFETIME}
      );

    const refreshToken = jwt.sign (
      {id: user._id, isAdmin: user.isAdmin},
      process.env.REFRESH_TOKEN,
      {expiresIn: process.env.JWT_REFRESH}
    );

    await Users.findByIdAndUpdate (
      user._id,
      {
        $set: {
          refresh_token: refreshToken,
        },
      },
      {$new: true}
    );

    res.cookie ('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: process.env.JWT_REFRESH_TOKEN,
    });

    const {password, ...info} = user._doc;
    return res.status (200).json ({info, accessToken});
  } catch (error) {
    return res.status (500).json (error);
  }
});

router.get ('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    if (!refreshToken) res.status (401).json ('You are not Authenticated');

    const user = await Users.findOne ({
      refresh_token: refreshToken,
    });
    if (!user) res.status (403).json ('User not found');
    // console.log (refreshToken);
    jwt.verify (refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) return res.status (403);
      const accessToken =
        jwt.sign (
          {
            id: user._id,
            isAdmin: user.isAdmin,
          },
          process.env.ACCESS_TOKEN,
          {expiresIn: process.env.JWT_LIFETIME}
        );
      return res.status (200).json (accessToken);
    });
  } catch (error) {
    res.status (500).json (error);
  }
});

router.delete ('/logout', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus (204);
  const user = Users.findOne ({
    refresh_token: refreshToken,
  });
  // console.log (user);

  if (!user) return res.sendStatus (204);
  await Users.findByIdAndUpdate (
    user._id,
    {
      $set: {
        refresh_token: refreshToken,
      },
    },
    {$new: true}
  );

  res.clearCookie ('refreshToken');
  return res.status (200).json('You are Successfully log out');
});

module.exports = router;
