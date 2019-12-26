(function (){
	var canvas_elem = document.getElementById("canvas")
	canvas_elem.id = "canvas"
	canvas_elem.width = CANVAS_WIDTH
	canvas_elem.height = CANVAS_HEIGHT
	// var audioCtx = new AudioContext();
	// var offlineCtx = new OfflineAudioContext(2,44100*40,44100);
})()

const trampoline_bounce = 0.9


var o1 = new Paddle([
		new Point(0, window.innerHeight-200),
		new Point(300, window.innerHeight-20),
	],
	{
		strokeColor:'blue',
		lineWidth: "3",
		// fillColor: "grey"
		bounce: trampoline_bounce,
		keyCode: LEFTKEY,
		pivotIndex: 0,
		clockwise: false
	}
)

var o2 = new Paddle([
		new Point(window.innerWidth, window.innerHeight-200),
		new Point(window.innerWidth-300, window.innerHeight-20),
	],
	{
		strokeColor:'green',
		lineWidth: "3",
		// fillColor: "grey"
		bounce: trampoline_bounce,
		keyCode: RIGHTKEY,
		pivotIndex: 0
	}
)

var o3 = new Obstacle([
	new Point(0, 300),
	new Point(300, 0)],
	{
		lineWidth: "2",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)

var o4 = new Obstacle([
	new Point(window.innerWidth-300, 0),
	new Point(window.innerWidth, 300)],
	{
		lineWidth: "2",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)


var ground = new Obstacle([new Point(0,window.innerHeight-20), new Point(window.innerWidth,window.innerHeight-20)], {})

var right = new Obstacle([ new Point(window.innerWidth, window.innerHeight-20), new Point(window.innerWidth, 0)], {})

var left = new Obstacle([new Point(0, window.innerHeight-20), new Point(0, 0)], {})

var topy = new Obstacle([new Point(0, 0), new Point(window.innerWidth, 0)], {})



var e = new Environment()
e.addObstacle(ground)
e.addObstacle(right)
e.addObstacle(left)
e.addObstacle(topy)
e.addObstacle(o1)
e.addObstacle(o2)
e.addObstacle(o3)
e.addObstacle(o4)
e.draw()


e.addProjectile(new Projectile(new Point(window.innerWidth-15, window.innerHeight-500), "red", new VelocityVector(0,0)))
e.runloop()

// function start(evnt) {
// 	window.removeEventListener('click', start)
// 	e.addProjectile(new Projectile(new Point(window.innerWidth-15, window.innerHeight-500), "red", new VelocityVector(0,0)))
// 	e.runloop()
// }

// window.addEventListener('click', start)

