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
		return new Vector2(x * other.x, y * other.y);
	};
	
	this.div = function(other) {
		return new Vector2(x / other.x, y / other.y);
	};
	
	this.dot = function(other) {
		return x * other.x + y * other.y;
	};
	
	this.ceil = function() {
		return new Vector2(Math.ceil(x), Math.ceil(y));
	};
	this.addScalar = function(number) {
		return new Vector2(x + number, y + number);
	};
	this.divScalar = function(number) {
		return new Vector2(x / number, y / number);
	};
}

function Viewport(position, size) {
	this.position = position;
	this.size = size;
}

function createSkewedRect(x1, x2, y, w, h) {
	var points = [new Vector2(x1, y),
	              new Vector2(x2, y + h - 1),
	              new Vector2(x2 + w + 1, y + h - 1),
	              new Vector2(x1 + w + 1, y)];
	              
	return new Polygon(points);
}

function createRect(x, y, w, h) {
	var points = [new Vector2(x, y),
	              new Vector2(x, y + h - 1),
	              new Vector2(x + w - 1, y + h - 1),
	              new Vector2(x + w - 1, y)];
	return new Polygon(points);
}

function Line(from, to) {
	this.from = from;
	this.to = to;
}

function Polygon(points) {
	this.points = points;
	
	this.contains = function(vec) {
		var lin = this.lines();
		for(var i = 0; i < lin.length; i++) {
			var line = lin[i];
			var a = line.from;
			var b = line.to;
			var c = vec;
			if((b.x - a.x) * (c.y - a.y) - 
					(b.y - a.y) * (c.x - a.x) > 0) {
						return false;
					}
		}
		return true;
	};
	
	this.minY = function() {
		var min = points[0].y;
		points.forEach(function(p) {
			if(p.y < min){
				min = p.y;
			}
		});
		return min;
	};
	
	this.lines = function() {
		var result = [];
		var prev = points[0];
		for(var i = 1; i < points.length; i++) {
			var curr = points[i];
			result.push(new Line(prev, curr));
			prev = curr;
		};
		result.push(new Line(points[points.length - 1], points[0]));
		return result;
	};
}

function Renderer(display, viewport) {
	
	var ctx = display.getContext("2d");
	var onMouseClick = null;
	var onMoveListner = function(evt) {
		if(onMouseClick !== null) {
			var rect = display.getBoundingClientRect();
			var pos = new Vector2(evt.clientX - rect.left, evt.clientY - rect.top);
			onMouseClick(toWorldVector(pos));
		}
	};
	
	
	this.start = function() {
		display.addEventListener('mousemove', onMoveListner);
	};
	
	this.stop = function() {
		display.removeEventListener('mousemove', onMoveListner);
	};
	
	this.setMouseClickListener = function(func) {
		onMouseClick = func;
	};
	
	this.fillScreen = function() {
		ctx.fillStyle = "#FF0000";
		ctx.fillRect(0, 0, display.clientWidth, display.clientHeight);
	};
	
	this.drawText = function(text, position, fontSize) {
		ctx.fillStyle = "#000000";
		ctx.font = fontSize + 'px Calibri';
		var measure = ctx.measureText(text);
		var measureVec = new Vector2(measure.width, fontSize);
		var clientSize = new Vector2(display.clientWidth, display.clientHeight);
		var absPos = clientSize.mult(position).subtract(measureVec.divScalar(2));
		ctx.fillText(text, absPos.x, absPos.y);
	};
	
	this.drawCircle = function(worldPos) {
		var screenPos = toPixelVector(new Vector2(worldPos.x, worldPos.y));
		ctx.fillStyle = "#0000FF";
		ctx.beginPath();
		ctx.arc(screenPos.x, screenPos.y, 2.5, 0, 2 * Math.PI);
		ctx.fill();
	};
	
	this.drawPolygon = function(polygon) {
		if(polygon.points.length > 1) {
			ctx.fillStyle = "#FFFFFF";
			ctx.strokeStyle = "#FFFFFF";
			ctx.beginPath();
			var start = toPixelVector(polygon.points[0]);
			ctx.moveTo(start.x + 0.5, start.y + 0.5);
			polygon.points.forEach(function(point) {
				var vec = toPixelVector(point);
				ctx.lineTo(vec.x + 0.5, vec.y + 0.5);
			});
			ctx.lineTo(start.x + 0.5, start.y + 0.5);
			ctx.fill();
			ctx.stroke();
		}
	};
	
	var toPixelVector = function(vec) {
		var clientSize = new Vector2(display.clientWidth, display.clientHeight);
		return vec.subtract(viewport.position).mult(clientSize.div(viewport.size));
	};
	
	var toWorldVector = function(vec) {
		var clientSize = new Vector2(display.clientWidth, display.clientHeight);
		return vec.mult(viewport.size.div(clientSize)).add(viewport.position);
	};
}

function rand(from, to) {
	return from + Math.random() * (to - from);
}

function WorldGenerator(minX, maxX) {
	var lastPosition = new Vector2(-2.5, -4);
	var width = 3;
	var height = 6;
	var displacement = 4;
	var isFirst = true;
	
	this.generateNext = function() {
		if(isFirst) {
			isFirst = false;
			return createRect(minX, -5, maxX - minX, 10);
		}
		var pos = new Vector2(lastPosition.x + rand(-displacement, displacement), 
				lastPosition.y - height);
		if(pos.x < minX) {
			pos.x = minX;
		}
		if(pos.x + width >= maxX) {
			pos.x = maxX - width;
		}
		var rect = createSkewedRect(pos.x, lastPosition.x, pos.y, width, lastPosition.y - pos.y + 1);
		lastPosition = pos;
		return rect;
	};
	
	this.setWidth = function(w) {
		lastPosition.x += (width - w) / 2;
		width = w;
	};
	
	this.getWidth = function() {
		return width;
	};
}

function Game(display) {
	
	var points = 0;
	var running = true;
	
	var viewport = new Viewport(new Vector2(-5, -5), new Vector2(10, 20));
	var playerPosition = new Vector2(0, 0);
	var intervalHandle = null;
	var renderer = new Renderer(display, viewport);
	var restartListener = null;
	renderer.setMouseClickListener(function(clickedPosition) {
		if(running) {
			var pos = new Vector2(clickedPosition.x, playerPosition.y);
			playerPosition = pos;			
		}
	});
	var world = [];
	var worldGenerator = new WorldGenerator(-4, 4);
	world.push(worldGenerator.generateNext());
	var mouseDownListener = function(evt) {
		if(!running && restartListener !== null) {
			restartListener();
		}
	};
	
	var increaseDifficulty = function() {
		//worldGenerator.displacement *= 1.1;
		worldGenerator.setWidth(worldGenerator.getWidth() * 0.9);
		worldGenerator.height *= 0.9;
	};
	
	var update = function() {
		if(running) {
			var movePerStep = 0.2;
			playerPosition.y -= movePerStep;
			viewport.position.y -= movePerStep;
			checkCollision();
			points++;		
			if(points % 200 === 0) {
				increaseDifficulty();
			}
			while(world[world.length - 1].minY() >= viewport.position.y) {
				world.push(worldGenerator.generateNext());
			}
		}
	};
	
	var checkCollision = function() {
		if(playerWall()) {
			playerLose();
		}
	};
	
	var playerWall = function() {
		for(var i = 0; i < world.length; i++) {
			if(world[i].contains(playerPosition)) {
				return false;
			}
		}
		return true;
	};
	
	var playerLose = function() {
		running = false;
	};
		
	var draw = function() {
		renderer.fillScreen();
		world.forEach(function(poly) {
			renderer.drawPolygon(poly);
		});
		renderer.drawCircle(playerPosition);
		renderer.drawText("Punkte: " + points, new Vector2(0.05, 0.05), 16);
		if(!running) {
			renderer.drawText("GAME OVER", new Vector2(0.5, 0.40), 50);
			renderer.drawText("Touch screen to try again", new Vector2(0.5, 0.45), 16);
		}
	};
	
	this.start = function() {
		renderer.start();
		display.addEventListener('mousedown', mouseDownListener);
		intervalHandle = setInterval(function() {
			update();
			draw();
		}, 50);
	};
	
	this.stop = function() {
		renderer.stop();
		display.removeEventListener('mousedown', mouseDownListener);
		if(intervalHandle !== null) {
			clearInterval(intervalHandle);
			intervalHandle = null;			
		}
	};
	
	this.setRestartListener = function(listener) {
		restartListener = listener;
	};
	
}
