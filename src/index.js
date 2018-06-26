/* eslint no-console: "off" */
import express from 'express';
import { createServer } from 'http';
import constants from './config/constants';
import middleWares from './config/middleWares';
import handlers from './config/handlers';

const app = express();
middleWares(app);
handlers(app);

const server = createServer(app);
server.listen(constants.PORT, (err) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`BinPar VBT started at port: ${constants.PORT}`);
  }
});
