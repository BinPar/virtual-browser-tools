import puppeteer from 'puppeteer';
import log, { LOG_OPTIONS } from './tools/logger';

const DEFAULT_SCREENSHOT_OPTIONS = {
  type: 'jpeg',
  quality: 95,
  fullPage: true,
  encoding: 'binary',
};

const DEFAULT_PDF_OPTIONS = {
  printBackground: true,
};

const DEFAULT_VIEWPORT = {
  width: 1980,
  height: 1080,
  isMobile: false,
};

const DEFAULT_WAITING_FOR_SELECTOR_OPTIONS = {
  visible: true,
};

class Puppeteer {
  async getNewBrowser() {
    log(LOG_OPTIONS.VERBOSE, 'Launching puppeteer...');
    this.browser = await puppeteer.launch();
    log(LOG_OPTIONS.INFO, 'NEW browser created');
    return this.browser;
  }

  async getBrowser() {
    if (this.browser) {
      return this.browser;
    }
    return this.getNewBrowser();
  }

  async newPageAndGotoAndWaitForOptions(
    url,
    viewport,
    userAgent,
    legacy,
    selector,
    gotoOptions = {},
  ) {
    const browser = await this.getBrowser();
    log(LOG_OPTIONS.VERBOSE, '[Navigation & waiting] :: Creating NEW page...');
    const page = await browser.newPage();
    log(LOG_OPTIONS.VERBOSE, '[Navigation & waiting] :: NEW page created');
    const viewportOptions = {
      ...DEFAULT_VIEWPORT,
      ...viewport,
    };
    log(LOG_OPTIONS.INFO, '[Navigation & waiting] :: Setting viewport to: ', viewportOptions);
    await page.setViewport(viewportOptions);
    log(LOG_OPTIONS.VERBOSE, '[Navigation & waiting] :: Viewport changed');
    if (userAgent) {
      log(LOG_OPTIONS.INFO, `[Navigation & waiting] :: User Agent ${userAgent}`);
      await page.setUserAgent(userAgent);
    }
    log(LOG_OPTIONS.VERBOSE, `[Navigation & waiting] :: Going to ${url} ...`);
    const mergedGotoOptions = gotoOptions;
    if (legacy.waitTimeout) {
      log(
        LOG_OPTIONS.INFO,
        '[Navigation & waiting] :: Switching GOTO "waitUntil" to "networkidle0" because we detected a legacy "waitTimeout" param',
      );
      mergedGotoOptions.waitUntil = 'networkidle0';
    }
    await page.goto(url, mergedGotoOptions);
    log(LOG_OPTIONS.VERBOSE, `[Navigation & waiting] :: We are in ${url} now`);
    if (selector || legacy.selector) {
      log(
        LOG_OPTIONS.INFO,
        `[Navigation & waiting] :: Waiting for selector ${legacy.selector} ...`,
      );
      await page.waitForSelector(selector || legacy.selector, DEFAULT_WAITING_FOR_SELECTOR_OPTIONS);
    }
    return page;
  }

  async getScreenshot({
    url,
    screenshotOptions,
    viewport = {},
    userAgent,
    legacy,
    selector,
    gotoOptions,
  }) {
    try {
      log(
        LOG_OPTIONS.INFO,
        '[getScreenshot] :: OPTIONS: ',
        url,
        viewport,
        userAgent,
        legacy,
        screenshotOptions,
      );
      const page = await this.newPageAndGotoAndWaitForOptions(
        url,
        viewport,
        userAgent,
        legacy,
        selector,
        gotoOptions,
      );
      const options = {
        ...DEFAULT_SCREENSHOT_OPTIONS,
        ...screenshotOptions,
      };
      if (
        legacy.screenshotOptions &&
        (legacy.screenshotOptions.width ||
          legacy.screenshotOptions.height ||
          legacy.screenshotOptions.x ||
          legacy.screenshotOptions.y)
      ) {
        options.fullPage = false;
        options.clip = {
          width: legacy.screenshotOptions.width || 0,
          height: legacy.screenshotOptions.height || 0,
          x: legacy.screenshotOptions.x || 0,
          y: legacy.screenshotOptions.y || 0,
        };
      }
      log(
        LOG_OPTIONS.VERBOSE,
        '[getScreenshot] :: Getting screenshot with this options: ',
        options,
      );
      const screenshotBuffer = await page.screenshot(options);
      log(LOG_OPTIONS.VERBOSE, '[getScreenshot] :: Screenshot buffer obtained');
      log(LOG_OPTIONS.VERBOSE, '[getScreenshot] :: Closing page...');
      page
        .close()
        .then(() => log(LOG_OPTIONS.VERBOSE, '[getScreenshot] :: Page closed'))
        .catch((err) => {
          log(LOG_OPTIONS.ERRORS, '[getScreenshot - page.close] :: ERROR', err);
        });
      return screenshotBuffer;
    } catch (err) {
      log(LOG_OPTIONS.ERRORS, '[getScreenshot] :: ERROR', err);
      return null;
    }
  }

  async getPDF({ url, pdfOptions, viewport = {}, userAgent, legacy, selector, gotoOptions }) {
    try {
      const { usePrint, ...options } = pdfOptions;
      log(LOG_OPTIONS.INFO, '[getPDF] :: OPTIONS: ', url, viewport, userAgent, legacy, pdfOptions);
      const page = await this.newPageAndGotoAndWaitForOptions(
        url,
        viewport,
        userAgent,
        legacy,
        selector,
        gotoOptions,
      );
      if (!usePrint) {
        log(LOG_OPTIONS.VERBOSE, '[getPDF] :: Using "screen" type for render ...');
        await page.emulateMedia('screen');
      }
      if (
        legacy.pdfOptions.printBackground !== undefined ||
        legacy.pdfOptions.printBackground !== null
      ) {
        options.printBackground = legacy.pdfOptions.printBackground;
      }
      if (legacy.pdfOptions.landscape !== undefined || legacy.pdfOptions.landscape !== null) {
        options.landscape = legacy.pdfOptions.landscape;
      }
      if (legacy.pdfOptions.pageSize) {
        options.format = legacy.pdfOptions.pageSize;
      }
      if (legacy.pdfOptions.width) {
        options.width = legacy.pdfOptions.width;
      }
      if (legacy.pdfOptions.height) {
        options.height = legacy.pdfOptions.height;
      }
      log(LOG_OPTIONS.VERBOSE, '[getPDF] :: Getting PDF');
      const pdfBuffer = await page.pdf({
        ...DEFAULT_PDF_OPTIONS,
        ...options,
      });
      log(LOG_OPTIONS.VERBOSE, '[getPDF] :: PDF buffer obtained');
      log(LOG_OPTIONS.VERBOSE, '[getPDF] :: Closing page...');
      page
        .close()
        .then(() => log(LOG_OPTIONS.VERBOSE, '[getPDF] :: Page closed'))
        .catch((err) => {
          log(LOG_OPTIONS.ERRORS, '[getPDF - page.close] :: ERROR', err);
        });
      return pdfBuffer;
    } catch (err) {
      log(LOG_OPTIONS.ERRORS, '[getPDF] :: ERROR', err);
      return null;
    }
  }
}

export default new Puppeteer();
