var db;
var tmr = null;
module.exports = function (store) {
	connectMysql();
	function connectMysql() {
		if (tmr) clearTimeout(tmr);
		if (db) db.end();
		db = require('mysql').createConnection(process.env.mysql);
		db.connect(function (err) {
			if (err) {
				console.error('Mysql connect error', err);
				setTimeout(connectMysql, 10000);
				return;
			}
			console.log('Mysql connected to ' + db.config.host);
			poll();
		});
		db.on('error', function (err) {
			console.error('Mysql error', err);
			db = null;
			setTimeout(connectMysql, 10000);
		});
	}

	function poll() {
		if (tmr) clearTimeout(tmr);
		tmr = setTimeout(poll, 1000);

		var tm = Date.now();
		db.query("select " +
		"id, user, host, db, time, state, info " +
		"from INFORMATION_SCHEMA.PROCESSLIST where command ='query' and time>0", function (err, results) {

			//This query is much lower impact on mysql, but you need to have performance_schema enabled

			//db.query("select " +
			//"thread_id threadId, " +
			//"processlist_id id, " +
			//"processlist_user user," +
			//"processlist_host host," +
			//"processlist_db db," +
			//"processlist_time time," +
			//"processlist_state state," +
			//"processlist_info info " +
			//"from performance_schema.threads where PROCESSLIST_COMMAND!='Sleep' and PROCESSLIST_TIME>0", function (err, results) {
			if (err) {
				console.error('query error', err);
				connectMysql();
				return;
			}
			tm = Date.now() - tm;

			console.log('tm', tm, results.length)
			store.update(results);
		});
	}

};