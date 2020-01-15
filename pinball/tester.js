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
		new Point(200, window.innerHeight-20),
		// new Point(0, window.innerHeight-20),
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
		new Point(window.innerWidth-200, window.innerHeight-20),
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


var container = new Obstacle([
	new Point(0,window.innerHeight-20),
	new Point(window.innerWidth,window.innerHeight-20),
	new Point(window.innerWidth, 0),
	new Point(0, 0)
	],
	{fill:false}
)

// o2.addEventListener('collision', (surface, projectile)=>{
// 	console.clear()
// 	console.log("Bang!!")
// 	console.log(projectile.velocity)
// 	console.log(surface.angle)
// 	throw new Error("Pause")
// })


var e = new Environment()
e.addObstacle(container)
e.addObstacle(o1)
e.addObstacle(o2)
e.addObstacle(o3)
e.addObstacle(o4)
e.draw()


e.addProjectile(new Projectile(new Point(window.innerWidth-105, window.innerHeight-500), "red", new VelocityVector(0,-200)))
e.runloop()

// function start(evnt) {
// 	window.removeEventListener('click', start)
// 	e.addProjectile(new Projectile(new Point(window.innerWidth-15, window.innerHeight-500), "red", new VelocityVector(0,0)))
// 	e.runloop()
// }

// window.addEventListener('click', start)















// COLLISION!!!!! engine.js:477:14
// Object { x_component: -319.1807591885485, y_component: 527.3265863638965, mass: 1 }
// engine.js:495:14
// v
// Object { x_component: 2586.605197152281, y_component: 0, mass: 1 }
// engine.js:496:14
// v
// Object { x_component: -69.90764133165465, y_component: -2585.6603349277407, mass: 1 }
// engine.js:500:14
// Object { x_component: -389.08840052020315, y_component: -2058.333748563844, mass: 1 }
// engine.js:503:14
// radiusLine.angle -1.548709711378596 engine.js:504:14
// tilt_angle 91.54870971137859 engine.js:505:14
// omega 10.471975511965978 engine.js:506:14
// COLLISION!!!!! engine.js:477:14
// Object { x_component: -389.08840052020315, y_component: -2042.637748563844, mass: 1 }
// engine.js:495:14
// v
// Object { x_component: 2605.7740790162484, y_component: 0, mass: 1 }
// engine.js:496:14
// v
// Object { x_component: 34.48740383993623, y_component: -2605.545848732921, mass: 1 }
// engine.js:500:14
// Object { x_component: -354.6009966802669, y_component: -4648.183597296766, mass: 1 }
// engine.js:503:14
// radiusLine.angle 0.7583314279008283 engine.js:504:14
// tilt_angle 89.24166857209917 engine.js:505:14
// omega 10.471975511965978 engine.js:506:14
// COLLISION!!!!! engine.js:477:14
// Object { x_component: -354.6009966802669, y_component: -4631.506597296766, mass: 1 }
// engine.js:495:14
// v
// Object { x_component: 2682.519518722113, y_component: 0, mass: 1 }
// engine.js:496:14
// v
// Object { x_component: 478.33371937639623, y_component: -2639.527954243459, mass: 1 }
// engine.js:500:14
// Object { x_component: 123.73272269612931, y_component: -7271.034551540225, mass: 1 }
// engine.js:503:14
// radiusLine.angle 10.271634139236006 engine.js:504:14
// tilt_angle 79.728365860764 engine.js:505:14
// omega 10.471975511965978