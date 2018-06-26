import puppeteer from '../puppeteer';
import log, { LOG_OPTIONS } from '../tools/logger';
import translateLegacyOptions from '../tools/translateLegacyOptions';

export default async function screenshotHandler(req, res) {
  const { url, viewport, userAgent, gotoOptions, ...options } = req.body || {};
  log(LOG_OPTIONS.INFO, '[screenshotHandler] :: request options: ', req.body);
  if (url) {
    const { legacy, newOptions } = translateLegacyOptions(options);
    const img = await puppeteer.getScreenshot({
      url,
      viewport,
      userAgent,
      gotoOptions,
      legacy,
      screenshotOptions: newOptions,
    });
    if (img) {
      log(LOG_OPTIONS.VERBOSE, '[screenshotHandler] :: Sending screenshot back');
      res.end(img);
    }
    log(LOG_OPTIONS.ERROR, '[screenshotHandler] :: Error: No buffer returned');
    res.status(501).end('No buffer returned');
  } else {
    log(LOG_OPTIONS.WARNING, '[screenshotHandler] :: No URL provided');
    res.status(501).end('No URL. Exit');
  }
}
