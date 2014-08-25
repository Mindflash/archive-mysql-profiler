var static = require('node-static');
var pub = new static.Server('./public');

var app = require('http').createServer(handler)
var io = require('socket.io')(app);

var lvl = require('level')('./db.lvl', {valueEncoding: 'json'});
var lvlStore = require('./levelStore')(lvl);

app.listen(80, function (err) {
	if (err) throw err;
	console.log('listening on 80');

	require('./mysqlPoller')(lvlStore);
});

require('./queryServer')(io, lvl);

function handler(req, res) {
	req.addListener('end', function () {
		pub.serve(req, res);
	}).resume();
}

//io.on('connection', function (socket) {
//	socket.emit('news', {hello: 'world'});
//	socket.on('my other event', function (data) {
//		console.log(data);
//	});
//});

