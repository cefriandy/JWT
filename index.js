const express = require ('express');
const cors = require ('cors');
const xss = require ('xss-clean');

const mongoose = require ('mongoose');
const dotenv = require ('dotenv');
const cookieParser = require ('cookie-parser');
const authRouter = require ('./routes/auth');
const userRouter = require ('./routes/users.js');
const movieRouter = require ('./routes/movies');
const listRouter = require ('./routes/list');

const swaggerUI = require ('swagger-ui-express');
const YAML = require ('yamljs');
const swaggerDocument = YAML.load ('./swagger.yaml');
const app = express ();

dotenv.config ();

app.use (express.json ());
app.use (cookieParser ());
app.use (cors ({credentials: true, origin: process.env.CORSE}));
app.use (xss ());

app.get ('/', (req, res) => {
  res.send (
    '<h1 style="text-align: center">API Docs</h1><a href="/api-docs"><h2 style="text-align:center">API Documentation</h2></a>'
  );
});
app.use ('/api-docs', swaggerUI.serve, swaggerUI.setup (swaggerDocument));


const connect = async () => {
  try {
    await mongoose.connect (process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useCreateIndex: true,
    });
    console.log ('DB is successfully connected');
  } catch (error) {
    console.error (error);
  }
};

connect ();

app.use ('/api/v1', authRouter);
app.use ('/api/v1/user', userRouter);
app.use ('/api/v1/movie', movieRouter);
app.use ('/api/v1/list', listRouter);

app.listen (process.env.PORT || 5000, () => {
  `Server running on ${process.env.PORT || 8081}`
});
