const options = {};

if (process.env.NODE_ENV === 'production') {
  options.production = true;
  options.PORT = process.env.PORT || 3004;
} else {
  options.production = false;
  options.PORT = process.env.PORT || 3004;
}

export default options;
