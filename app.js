"use strict";
const Nightmare = require('nightmare');
const nightmare = Nightmare({ show: false });
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const reqQueue = [];

const logOptions = {
		noLog: 1,
		errors: 2,
		info: 3,
		verbose: 4
};

const logMode = logOptions[process.env.LOG] || logOptions.verbose;

if(logMode >= logOptions.noLog) {
	console.log("Log mode:" + logMode);
}

nightmare.viewport(1920, 1080);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let devicePixelRatio = null;
const DEFAULT_SCREENSHOT_CLIP_OPTIONS = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};

let pendent = false;
let goToGoogleTimeout = null;
const runNextAction = function () {
	if(goToGoogleTimeout) {
		clearTimeout(goToGoogleTimeout);
		goToGoogleTimeout = null;
	}
	pendent = false;
	if(logMode >= logOptions.verbose) {
		console.log("running next action");
	}
	const next = reqQueue.shift();
	if(next) {
		pendent = true;
		next();
	} else {
		if(logMode >= logOptions.verbose) {
			console.log("Go to google in 5 secs....");
		}
		goToGoogleTimeout = setTimeout(() => {
			if(logMode >= logOptions.verbose) {
				console.log("Going to Google NOW");
			}
			nightmare.goto('https://www.google.es').then(()=>{}).catch(()=>{});
		}, 5000);
	}
};

const getPicture = function(url, options) {
	options = options || {};
	let res = nightmare.goto(url + '?v=' + new Date().getTime());
	if(logMode >= logOptions.info) {
		console.log('[getPicture] after goto');
	}
	if(options.selector) {
		res = res.wait(options.selector);
		if(logMode >= logOptions.info) {
			console.log('[getPicture] after wait selector');
		}
	} else {
		res = res.wait(options.waitTimeout || 200);
		if(logMode >= logOptions.info) {
			console.log('[getPicture] after wait timeout');
		}
	}
	res = res.evaluate(function() {
		document.body.style.transformOrigin = "0 0";
		document.body.style.transform = "scale(" + (1 / devicePixelRatio) + ")";
	});
	if(logMode >= logOptions.info) {
		console.log('[getPicture] after evaluate');
	}
	if(options.screenshotOptions) {
		Object.keys(options.screenshotOptions).forEach((key)=>{
			options.screenshotOptions[key] = options.screenshotOptions[key] / devicePixelRatio;
		});
		options.screenshotOptions = Object.assign({}, DEFAULT_SCREENSHOT_CLIP_OPTIONS, options.screenshotOptions);
		if(logMode >= logOptions.info) {
			console.log('[getPicture] screenOptions');
		}
	}
	return res.screenshot(null, options.screenshotOptions);
};

const getPDF = function(url, options) {
	options = options || {};
	let res = nightmare.goto(url);
	if(logMode >= logOptions.info) {
		console.log('[getPDF] after goto');
	}
	if(options.selector) {
		res = res.wait(options.selector);
		if(logMode >= logOptions.info) {
			console.log('[getPDF] after wait selector');
		}
	} else {
		res = res.wait(options.waitTimeout || 200);
		if(logMode >= logOptions.info) {
			console.log('[getPDF] after wait timeout');
		}
	}
	return res.pdf(null, options.pdfOptions || {});
};

app.post('/imageFromUrl', function (req, res) {
	const body = req.body;
	if(logMode >= logOptions.info) {
		console.log('OPTIONS: ', body);
	}
	if(body.url) {
		try {
			if (!devicePixelRatio) {
				if(logMode >= logOptions.info) {
					console.log('NO DevicePixelRatio. Calculating...');
				}
				reqQueue.push(()=> {
					nightmare
						.goto(body.url)
						.evaluate(function () {
							return window.devicePixelRatio;
						})
						.then((value) => {
							devicePixelRatio = value;
							if(logMode >= logOptions.info) {
								console.log('DevicePixelRatio: ' + value);
							}
							getPicture(body.url, body.options).then((img) => {
								if(logMode >= logOptions.verbose) {
									console.log('IMG:', img);
								}
								res.end(img);
								runNextAction();
							}).catch(function (error) {
								if(logMode >= logOptions.error) {
									console.log('Capture failed:', error);
								}
								res.status(501).end('Capture failed:' + error);
								runNextAction();
							});
						})
						.catch((err) => {
							if(logMode >= logOptions.errors) {
								console.log('ERR: ', err);
							}
							res.status(501).end('Error trying to calculate device pixel ratio');
							runNextAction();
						});
					});
					if(!pendent) runNextAction();
			} else {
				reqQueue.push(()=> {
					getPicture(body.url, body.options).then((value) => {
						if(logMode >= logOptions.verbose) {
							console.log('IMG:', value);
						}
						res.end(value);
						runNextAction();
					}).catch(function (error) {
						if(logMode >= logOptions.error) {
							console.log('Capture failed:', error);
						}
						res.status(501).end('Capture failed:' + error);
						runNextAction();
					});
				});
				if(!pendent) runNextAction();
			}
		}
		catch(err) {
			if(logMode >= logOptions.error) {
				console.log('ERR:', err);
			}
			res.status(501).end('Server error');
		}
	} else {
		if(logMode >= logOptions.error) {
			console.log('No URL. Exit');
		}
		res.status(501).end('No URL. Exit');
	}
});


app.post('/PDFFromUrl', function (req, res) {
	const body = req.body;
	if(logMode >= logOptions.info) {
		console.log('OPTIONS: ', body);
	}
	if(body.url) {
		try {
				reqQueue.push(()=> {
					getPDF(body.url, body.options).then((value) => {
						if(logMode >= logOptions.verbose) {
							console.log('PDF:', value);
						}
						res.end(value);
						runNextAction();
					}).catch(function (error) {
						if(logMode >= logOptions.error) {
							console.log('Capture failed:', error);
						}
						res.status(501).end('Capture failed:' + error);
						runNextAction();
					});
				});
				if(!pendent) runNextAction();
		}
		catch(err) {
			if(logMode >= logOptions.error) {
				console.log('ERR:', err);
			}
			res.status(501).end('Server error');
		}
	} else {
		if(logMode >= logOptions.error) {
			console.log('No URL. Exit');
		}
		res.status(501).end('No URL. Exit');
	}
});


function normalizePort(val) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

let port = normalizePort(process.env.PORT || '3003');

if(process.env.IS_PROD){
	port = normalizePort('80');
}
console.log(port);
const server = app.listen(port, function () {
	console.log('Example app listening on port ' + port)
});
