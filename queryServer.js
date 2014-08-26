var _ = require('lodash');
module.exports = function (io, lvl) {
	io.on('connection', function (socket) {
		console.log('client connected');

		socket.on('query', function (query) {
			if (!query.start) {
				var dt = new Date();
				dt.setMinutes(dt.getMinutes() - 10);
				query.start = dt;
			} else
				query.start = new Date(query.start);

			query.end = query.end ? new Date(query.end) : new Date();
			query.resolution = query.resolution || 1000;

			//console.log('squery', query);

			var results = [];
			lvl.createValueStream({
				gte: query.start.toISOString(),
				lt: query.end.toISOString() + '~',
				limit: query.limit || 10000
			})
				.on('data', function (d) {
					results.push(d);
				})
				.on('close', function () {
					var stackedResult = buildItemStack(results, query);
					//console.log('stackedResult', results)
					socket.emit('queryResults', {
						query: query,
						stackedResult: stackedResult
					});

				});

		});
	});

};

function buildItemStack(items, query) {
	var t0 = query.start.valueOf();

	//Allow slower queries to float to the top. Include key to keep sort stable.
	items.sort(function (a, b) {return b.time - a.time || a.key.localeCompare(b.key);});
	var stackedResult = [];
	_.each(items, sortInStack);

	return items;

	function sortInStack(item) {
		var dt = Date.parse(item.date);
		item.begin = Math.round((dt - t0) / 1000);
		item.end = item.begin + item.time;

		item.stackLevel = findLowestAvailableStack(item);
	}

	//This brute-force search is going to be slow if there are too many items.
	function findLowestAvailableStack(item) {
		for (var stackLevel = 0; stackLevel < 1000; stackLevel++) {
			var stackLayer = stackedResult[stackLevel];
			if (!stackLayer) stackLayer = stackedResult[stackLevel] = [];

			if (!findItemInLayer(item, stackLayer)) {   //If we found a hole, stick this item in it and bail
				stackLayer.push(item);
				return stackLevel;
			}
		}
	}

	function findItemInLayer(item, stackLayer) {
		return _.find(stackLayer, function (stackItem) {        //Search for an item already in this spot
			return stackItem.begin <= item.end && stackItem.end >= item.begin;
		});
	}

}

