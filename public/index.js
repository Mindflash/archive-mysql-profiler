var socket = io();

var hash = window.location.hash.replace('#', '');
var rangeEnd = hash && new Date(hash);

var rangeSecs = 10 * 60;
var tmr = null;
function poll() {
	if (tmr) clearTimeout(tmr);
	var dt;
	if (!rangeEnd) {
		window.location.hash = '';
		tmr = setTimeout(poll, 1000);
		dt = new Date();
	} else {
		window.location.hash = rangeEnd.toISOString();
		dt = new Date(rangeEnd.valueOf());
	}
	dt.setSeconds(dt.getSeconds() - rangeSecs);

	//Right now it's dumb to use websockets since we're just polling anyway.
	socket.emit('query', {start: dt, end: rangeEnd});
}
poll();

socket.on('queryResults', function (data) {
	d3.select('#dateStart').html(new Date(data.query.start) + ' -- ' + formatTime(rangeSecs * 1000));
	d3.select('#dateEnd').html(new Date(data.query.end));

	var w = 1000;
	var h = 400;
	var levelSpacing = 10;
	var margin = {top: 10, right: 10, bottom: 10, left: 10};

	var x = d3.scale.linear()
		.domain([0, rangeSecs])
		.range([0, w]);

	var chart = d3.select(".chart");
	chart.attr("viewBox", [0, 0, w + margin.top + margin.bottom, h + margin.left + margin.right].join(' '));

	var lines = chart.selectAll("line").data(data.stackedResult, function (i) {return i.key});

	setLines(lines.transition())
		.attr('opacity', 1);    //Be sure to set opacity in case we do another update and interrupt the enter transition

	setLines(lines.enter().append("line"))
		.on('click', onClick)
		.attr('opacity', 0)
		.transition().attr('opacity', 1);

	lines.exit()
		.on('click', null)
		.remove();

	function setLines(selection) {
		selection
			.attr("x1", function (i) {return x(i.begin) + margin.left;})
			.attr("y1", function (i) {return i.stackLevel * levelSpacing + margin.top;})
			.attr("x2", function (i) {return x(i.end) + margin.left;})
			.attr("y2", function (i) {return i.stackLevel * levelSpacing + margin.top;})
			.attr("stroke", getLineColor);
		return selection;
	}
});

function getLineColor(i) {
	if (i.time < 5) return 'steelblue';
	if (i.time < 20) return 'orange';
	return 'red';
}

function onClick(item, idx) {
	d3.select('.selected').classed('selected', false);
	d3.select(this).classed('selected', true);

	var tmpl = d3.select('#queryTmpl').html();

	d3.select('#queryDetail').html(fillTmpl(tmpl, item));
	console.log(item);
}
function fillTmpl(tmpl, data) {
	//This templating is pretty bad and you should probably never use it
	Object.keys(data).forEach(function (key) {
		var val = data[key] || '';
		var re = '{{' + key + '}}';
		tmpl = tmpl.replace(re, val);
	});
	return tmpl;
}
function formatTime(ms) {
	var min = Math.floor(ms /= 60000) % 60;
	min = min < 10 ? '0' + min : min;
	return Math.floor(ms / 60) + ':' + min;
}

function zoomIn() {
	rangeSecs -= 60;
	poll();
}
function zoomOut() {
	rangeSecs += 60;
	poll();
}
function showOlder() {
	rangeEnd = rangeEnd || new Date();
	rangeEnd.setSeconds(rangeEnd.getSeconds() - rangeSecs / 2);
	poll();
}
function showNewer() {
	rangeEnd = rangeEnd || new Date();
	rangeEnd.setSeconds(rangeEnd.getSeconds() + rangeSecs / 2);
	if (rangeEnd > new Date()) rangeEnd = null;
	poll();
}