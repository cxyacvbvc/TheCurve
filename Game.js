"use strict";

function Vector2(x, y) {
	this.x = x;
	this.y = y;
	
	this.add = function(other) {
		return new Vector2(x + other.x, y + other.y);
	};
	
	this.subtract = function(other) {
		return new Vector2(x - other.x, y - other.y);
	};
	
	this.mult = function(other) {
		return new Vector2(x * other.y, y * other.y);
	};
	
	this.div = function(other) {
		return new Vector2(x / other.x, y / other.y);
	};
}

function Viewport(position, size) {
	this.position = position;
	this.size = size;
}

function createSkewedRect(x1, x2, y, w, h) {
	var points = [new Vector2(x1, y),
	              new Vector2(x1 + w + 1, y),
	              new Vector2(x2 + w + 1, y + h - 1),
	              new Vector2(x2, y + h - 1)];
	return new Polygon(points);
}

function createRect(x, y, w, h) {
	var points = [new Vector2(x, y),
	              new Vector2(x + w - 1, y),
	              new Vector2(x + w - 1, y + h - 1),
	              new Vector2(x, y + h - 1)];
	return new Polygon(points);
}

function Polygon(points) {
	this.points = points;
}

function Renderer(display, viewport) {
	
	var ctx = display.getContext("2d");
	
	this.fillScreen = function() {
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(0, 0, display.clientWidth, display.clientHeight);
	};
	
	this.drawCircle = function(worldPos) {
		var screenPos = toPixelVector(new Vector2(worldPos.x + 0.5, worldPos.y + 0.5));
		ctx.fillStyle = "#0000FF";
		ctx.beginPath();
		ctx.arc(screenPos.x, screenPos.y, 2.5, 0, 2 * Math.PI);
		ctx.fill();
	};
	
	this.drawPolygon = function(polygon) {
		if(polygon.points.length > 1) {
			ctx.fillStyle = "#FFFFFF";
			ctx.beginPath();
			var start = toPixelVector(polygon.points[0]);
			ctx.moveTo(start.x, start.y);
			polygon.points.forEach(function(point) {
				var vec = toPixelVector(point);
				ctx.lineTo(vec.x, vec.y);
			});
			ctx.lineTo(start.x, start.y);
			ctx.fill();			
		}
	};
	
	var toPixelVector = function(vec) {
		var clientSize = new Vector2(display.clientWidth, display.clientHeight);
		return vec.subtract(viewport.position).mult(clientSize.div(viewport.size));
	};
}

function rand(from, to) {
	return from + Math.random() * (to - from);
}

function WorldGenerator() {
	var lastPosition = new Vector2(-2.5, 1);
	var lastWidth = 5;
	
	this.generateNext = function() {
		var pos = new Vector2(lastPosition.x + rand(-4, 4), lastPosition.y + rand(-5, -10));
		var rect = createSkewedRect(lastPosition.x, pos.x, lastPosition.y, lastWidth, pos.y - lastPosition.y + 1);
		lastPosition = pos;
		return rect;
	};
	
}

function Game(display) {
	
	var viewport = new Viewport(new Vector2(-5, -5), new Vector2(10, 20));
	var playerPosition = new Vector2(0, 0);
	var intervalHandle = null;
	var renderer = new Renderer(display, viewport);
	var world = [];
	var worldGenerator = new WorldGenerator();
	for(var i = 0; i < 10; i++) {
		world.push(worldGenerator.generateNext());
	}
	
	var update = function() {
		var movePerStep = 0.2;
		playerPosition.y -= movePerStep;
		viewport.position.y -= movePerStep;
	};
	
	var draw = function() {
		renderer.fillScreen();
		world.forEach(function(poly) {
			renderer.drawPolygon(poly);
		});
		renderer.drawCircle(playerPosition);
	};
	
	this.start = function() {
		intervalHandle = setInterval(function() {
			update();
			draw();
		}, 50);
	};
	
	this.stop = function() {
		if(intervalHandle !== null) {
			clearInterval(intervalHandle);
			intervalHandle = null;			
		}
	};
	
}
