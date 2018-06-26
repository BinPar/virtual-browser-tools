/* eslint-disable no-param-reassign */
import bodyParser from 'body-parser';

export default (app) => {
  app.use(bodyParser.json({ limit: '1000mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
};
