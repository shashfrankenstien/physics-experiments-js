
var e = new Environment()
const trampoline_bounce = 1

var o1 = new Obstacle([
	new Point(0, window.innerHeight-300),
	new Point(300, window.innerHeight-20)],
	{
		strokeColor:'blue',
		lineWidth: "5",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)

var o2 = new Obstacle([
	new Point(window.innerWidth, window.innerHeight-300),
	new Point(window.innerWidth-300, window.innerHeight-20)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)

var o3 = new Obstacle([
	new Point(0, 300),
	new Point(300, 0)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)

var o4 = new Obstacle([
	new Point(window.innerWidth-300, 0),
	new Point(window.innerWidth, 300)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
		bounce: trampoline_bounce,
	}
)


var ground = new Obstacle([new Point(0,window.innerHeight-20), new Point(window.innerWidth,window.innerHeight-20)], {})

var right = new Obstacle([ new Point(window.innerWidth, window.innerHeight-20), new Point(window.innerWidth, 0)], {})

var left = new Obstacle([new Point(0, window.innerHeight-20), new Point(0, 0)], {})

var topy = new Obstacle([new Point(0, 0), new Point(window.innerWidth, 0)], {})


var b = new Projectile(new Point(50, 300), "red", new VelocityVector(0,0))

e.addObstacle(ground)
e.addObstacle(right)
e.addObstacle(left)
e.addObstacle(topy)
e.addObstacle(o1)
e.addObstacle(o2)
e.addObstacle(o3)
e.addObstacle(o4)
e.addProjectile(b)
e.runloop()

