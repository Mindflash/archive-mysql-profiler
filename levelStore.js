var _ = require('lodash');
var prev = [];
module.exports = function (lvl) {
	var o = {};

	o.update = function update(threads) {
		var inflight = [];

		var dt = new Date().toISOString();
		_.each(threads, function (thread) {
			var threadSig = _.pick(thread, 'id', 'user', 'host', 'db', 'info');

			var inflightThread = _.find(prev, threadSig);
			if (inflightThread) {
				thread.date = inflightThread.date;
				thread.key = inflightThread.key;
				thread.concurrency = Math.max(threads.length, inflightThread.concurrency);
			} else {
				thread.date = dt;
				thread.key = dt + '!' + thread.id;
				thread.concurrency = threads.length;
			}

			lvl.put(thread.key, thread);

			inflight.push(thread);
		});

		prev = inflight;
		//console.log(inflight);
	};

	return o;
};