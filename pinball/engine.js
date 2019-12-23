(function (){
	var canvas_elem = document.getElementById("canvas")
	canvas_elem.id = "canvas"
	canvas_elem.width = window.innerWidth
	canvas_elem.height = window.innerHeight

	// var audioCtx = new AudioContext();
	// var offlineCtx = new OfflineAudioContext(2,44100*40,44100);

})()

var GT = null

class Point {
	constructor(x, y){
		this.x = x // m
		this.y = y // m
	}
}


class VelocityVector {
	constructor(x_vel, y_vel){
		this.x_vel = x_vel // m/s
		this.y_vel = y_vel // m/s
	}

	tilt(theta) {
		var t = degToRadians(theta)
		var Xx_vel = Math.cos(t) * this.x_vel
		var Yx_vel = Math.sin(t) * this.x_vel * -1

		var Xy_vel = Math.sin(t) * this.y_vel
		var Yy_vel = Math.cos(t) * this.y_vel

		return new VelocityVector(Xx_vel+Xy_vel, Yx_vel+Yy_vel)
	}

	getNextPosition(pos, timedelta) {
		// console.log(pos, timedelta)
		var x = pos.x + (this.x_vel * timedelta)
		var y = pos.y + (this.y_vel * timedelta)
		return new Point(x, y)
	}
}


class LineSegment {
	constructor(p1, p2) {
		this.p1 = p1
		this.p2 = p2

		this.len = Math.sqrt(Math.pow(this.p2.y-this.p1.y, 2) + Math.pow(this.p2.x-this.p1.x, 2))
		this.slope = (this.p2.y-this.p1.y) / (this.p2.x-this.p1.x)
		this.c = this.p1.y - (this.slope*this.p1.x)
		this.angle = radiansToDeg(Math.atan(this.slope))
		// console.log(this.slope, this.angle, this.c)
		// if (this.p2.y > this.p1.y) this.angle *= -1
	}
}

class BasicPlane extends LineSegment {
	constructor(p1, p2, bounce) {
		super(p1, p2)
		this.bounce = bounce ? bounce : 1
	}

	applyForce(to_vect, direction) {
		var tmp = to_vect.tilt(this.angle)
		// reverse perpendicular component * bounce factor
		tmp.y_vel *= (-1 * this.bounce)
		var new_vect = tmp.tilt(-1*this.angle)
		console.log(to_vect, tmp, new_vect, this.angle, direction)
		return new_vect
	}

	isSurface(x, y) {
		return (y === (this.slope*x) + this.c)
	}

}

// Object { x_vel: 80, y_vel: 225.67277000000004 }

// Object { x_vel: 212.46507103972675, y_vel: -219.56472743626222 }

// Object { x_vel: 305.1367301662708, y_vel: -305.48274624703095 }
//  43.025065989118026 1


class Obstacle {
	constructor(points, options) {
		this.points = points
		this.options = options
		this.surfaces = []
	}

	draw(canvas) {
		canvas.beginPath()     // Start a new path.
		canvas.lineWidth = this.options.lineWidth
		canvas.strokeStyle = this.options.strokeColor  // This path is green.
		canvas.fillStyle = this.options.fillColor

		for(var i=0; i<this.points.length; i++) {
			if (i===0) {
				canvas.moveTo(this.points[i].x, this.points[i].y)
			} else {
				canvas.lineTo(this.points[i].x, this.points[i].y)
				this.surfaces.push(new BasicPlane(this.points[i], this.points[i-1]))
			}
		}

		canvas.fill()
		canvas.stroke()
		canvas.closePath()
	}
}



class Projectile {
	constructor(center, color) {
		this.center = center
		this.nextCenter = center
		this.color = color
		this.velocity = new VelocityVector(80, 200)
		this.timestamp = new Date()
	}

	isSurface(x, y) {
		return ((this.center.x===x) && (this.center.y==y))
	}

	_findCollisionPoint(surface) {
		var path = new LineSegment(this.center, this.nextCenter)
		var co = orientation(surface.p1, surface.p2, this.center)
		var px = this.center.x
		var py = this.center.y
		var no
		console.log("--------")
		console.log(this.center, this.nextCenter)
		console.log("--------")

		var startx = this.center.x
		var endx = this.nextCenter.x

		if (startx < endx) {
			var for_check = (x)=>x<endx
			var next_step = (x)=>x+0.1
		} else {
			var for_check = (x)=>x>endx
			var next_step = (x)=>x-0.1
		}

		for (var cx=this.center.x; for_check(cx); cx=next_step(cx)){
			var cy = (path.slope * cx) + path.c
			var r = new Point(cx, cy)
			console.log('r', r)
			no = orientation(surface.p1, surface.p2, r)
			if (co!==no) {
				return new Point(px, py)
			} else {
				co = no
				px = cx
				py = cy
			}
		}
		return this.nextCenter
	}

	computeNextPosition(props) {
		var newstamp = new Date()
		var timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
		// apply gravity
		this.velocity.y_vel += (9.81 * timedelta)
		this.nextCenter = this.velocity.getNextPosition(this.center, timedelta)
		// console.log(this.nextCenter)
		props.forEach(p=>{
			if (p instanceof Obstacle) {
				p.surfaces.forEach(line=>{
					var i = doIntersect(this.center, this.nextCenter, line.p1, line.p2)
					if (i!==404) {
						console.log("Bang!!", this.nextCenter)
						this.nextCenter = this._findCollisionPoint(line)
						this.velocity = line.applyForce(this.velocity, i || 1)
					}
				})
			}
		})
		this.timestamp = new Date()
		// console.log(this.timestamp)
	}

	draw(canvas, props) {
		canvas.lineWidth = "4"
		canvas.strokeStyle = this.color
		canvas.rect(this.nextCenter.x, this.nextCenter.y, 1, 1)
		canvas.stroke()
		this.center = this.nextCenter
		this.computeNextPosition(props)
		// canvas.fillStyle = this.color
		// canvas.fillRect(this.center.x, this.center.y, 1, 1)
	}
}


class Environment {
	constructor() {
		this.canvas_elem = document.getElementById("canvas")
		this.canvas = this.canvas_elem.getContext('2d')
		this.balls = []
		this.properties = {
			viewWidth: this.canvas_elem.width,
			viewHeight: this.canvas_elem.height,
			elements: []
		}
	}

	addObstacle(obs) {
		this.properties.elements.push(obs)
	}

	addProjectile(pro) {
		this.balls.push(pro)
	}

	runloop() {
		// var loop_start = new Date()
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.properties.elements.forEach(s=>s.draw(this.canvas))
		this.balls.forEach((b)=>b.draw(this.canvas, this.properties.elements))
		// var loop_end = new Date()
		// var diff = (loop_end.getTime() - loop_start.getTime())
		// console.log(diff)
		setTimeout(()=>this.runloop(), 30)
	}
}


var e = new Environment()


var o1 = new Obstacle([
	new Point(0, window.innerHeight-300),
	new Point(300, window.innerHeight-20)],
	{
		strokeColor:'blue',
		lineWidth: "5",
		// fillColor: "grey"
	}
)

var o2 = new Obstacle([
	new Point(window.innerWidth, window.innerHeight-300),
	new Point(window.innerWidth-300, window.innerHeight-20)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
	}
)

var o3 = new Obstacle([
	new Point(0, 300),
	new Point(300, 0)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
	}
)

var o4 = new Obstacle([
	new Point(window.innerWidth-300, 0),
	new Point(window.innerWidth, 300)],
	{
		strokeColor:'green',
		lineWidth: "5",
		// fillColor: "grey"
	}
)


var ground = new Obstacle([new Point(0,window.innerHeight-20), new Point(window.innerWidth,window.innerHeight-20)], {})

var right = new Obstacle([ new Point(window.innerWidth, window.innerHeight-20), new Point(window.innerWidth, 0)], {})

var left = new Obstacle([new Point(0, window.innerHeight-20), new Point(0, 0)], {})

var topy = new Obstacle([new Point(0, 0), new Point(window.innerWidth, 0)], {})


var b = new Projectile(new Point(50, 300), "red")

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


