import screenshotHandler from '../handlers/screenshot';
import pdfHandler from '../handlers/pdf';

const handlers = [{
  route: '/imageFromUrl',
  handler: screenshotHandler,
}, {
  route: '/PDFFromUrl',
  handler: pdfHandler,
}];

export default (app) => {
  handlers.forEach(h => app.use(h.route, h.handler));
};
