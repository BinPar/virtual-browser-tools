var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: false });
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

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
	var res = nightmare.goto(url + '?v=' + new Date().getTime());
	options = options || {};
	if(options.selector) {
		res = res.wait(options.selector);
	} else {
		res = res.wait(options.waitTimeout || 200);
	}
	res = res.evaluate(function() {
		document.body.style.transformOrigin = "0 0";
		document.body.style.transform = "scale(" + (1 / devicePixelRatio) + ")";
	});
	if(options.screenshotOptions) {
		Object.keys(options.screenshotOptions).forEach((key)=>{
			options.screenshotOptions[key] = options.screenshotOptions[key] / devicePixelRatio;
		});
		options.screenshotOptions = Object.assign({}, DEFAULT_SCREENSHOT_CLIP_OPTIONS, options.screenshotOptions);
	}
	return res.screenshot(null, options.screenshotOptions);
};

app.post('/imageFromUrl', function (req, res) {
	var body = req.body;
	console.log('OPTIONS: ', body);
	if(!devicePixelRatio) {
		nightmare
			.goto(body.url)
			.evaluate(function () {
				return window.devicePixelRatio;
			})
			.then((value) => {
				devicePixelRatio = value;
				getPicture(body.url, body.options).then((img) => {
					res.end(img);
				}).catch(function (error) {
					console.warn('Capture failed:', error);
					res.end('Capture failed:' + error);
				});
			});
	} else {
		getPicture(body.url, body.options).then((value) => {
			res.end(value);
		}).catch(function (error) {
			console.warn('Capture failed:', error);
			res.end('Capture failed:' + error);
		});
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

