import puppeteer from '../puppeteer';
import log, { LOG_OPTIONS } from '../tools/logger';
import translateLegacyOptions from '../tools/translateLegacyOptions';

export default async function pdfHandler(req, res) {
  const { url, viewport, userAgent, gotoOptions, ...options } = req.body || {};
  log(LOG_OPTIONS.INFO, '[pdfHandler] :: request options: ', req.body);
  if (url) {
    const { legacy, newOptions } = translateLegacyOptions(options);
    const pdf = await puppeteer.getPDF({
      url,
      viewport,
      userAgent,
      gotoOptions,
      legacy,
      pdfOptions: newOptions,
    });
    if (pdf) {
      log(LOG_OPTIONS.VERBOSE, '[pdfHandler] :: Sending PDF back');
      res.end(pdf);
    }
    log(LOG_OPTIONS.ERROR, '[pdfHandler] :: Error: No buffer returned');
    res.status(501).end('No buffer returned');
  } else {
    log(LOG_OPTIONS.WARNING, '[pdfHandler] :: No URL provided');
    res.status(501).end('No URL. Exit');
  }
}
