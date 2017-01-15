var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: false });
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
nightmare.viewport(1920, 1080);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var devicePixelRatio = null;
var DEFAULT_SCREENSHOT_CLIP_OPTIONS = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
};

var getPicture = function(url, options) {
	options = options || {};
	var res = nightmare.goto(url + '?v=' + new Date().getTime());
	console.log('[getPicture] after goto');
	if(options.selector) {
		res = res.wait(options.selector);
		console.log('[getPicture] after wait selector');
	} else {
		res = res.wait(options.waitTimeout || 200);
		console.log('[getPicture] after wait timeout');
	}
	res = res.evaluate(function() {
		document.body.style.transformOrigin = "0 0";
		document.body.style.transform = "scale(" + (1 / devicePixelRatio) + ")";
	});
	console.log('[getPicture] after evaluate');
	if(options.screenshotOptions) {
		Object.keys(options.screenshotOptions).forEach((key)=>{
			options.screenshotOptions[key] = options.screenshotOptions[key] / devicePixelRatio;
		});
		options.screenshotOptions = Object.assign({}, DEFAULT_SCREENSHOT_CLIP_OPTIONS, options.screenshotOptions);
		console.log('[getPicture] screenOptions');
	}
	return res.screenshot(null, options.screenshotOptions);
};

app.post('/imageFromUrl', function (req, res) {
	var body = req.body;
	console.log('OPTIONS: ', body);
	if(body.url) {
		try {
			if (!devicePixelRatio) {
				console.log('NO DevicePixelRatio. Calculating...');
				nightmare
					.goto(body.url)
					.evaluate(function () {
						return window.devicePixelRatio;
					})
					.then((value) => {
						devicePixelRatio = value;
						console.log('DevicePixelRatio: ' + value);
						getPicture(body.url, body.options).then((img) => {
							console.log('IMG:', img);
							res.end(img);
						}).catch(function (error) {
							console.log('Capture failed:', error);
							res.status(501).end('Capture failed:' + error);
						});
					})
					.catch((err) => {
						console.log('ERR: ', err);
						res.status(501).end('Error trying to calculate device pixel ratio');
					});
			} else {
				getPicture(body.url, body.options).then((value) => {
					console.log('IMG:', value);
					res.end(value);
				}).catch(function (error) {
					console.log('Capture failed:', error);
					res.status(501).end('Capture failed:' + error);
				});
			}
		}
		catch(err) {
			console.log('ERR:', err);
			res.status(501).end('Server error');
		}
	} else {
		console.log('No URL. Exit');
		res.status(501).end('No URL. Exit');
	}
});

function normalizePort(val) {
	var port = parseInt(val, 10);

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

var port = normalizePort(process.env.PORT || '3003');

if(process.env.IS_PROD){
	port = normalizePort('80');
}

var server = app.listen(port, function () {
	console.log('Example app listening on port ' + port)
});

