(function (){
	var canvas_elem = document.getElementById("canvas")
	canvas_elem.id = "canvas"
	canvas_elem.width = window.innerWidth
	canvas_elem.height = window.innerHeight
	// var audioCtx = new AudioContext();
	// var offlineCtx = new OfflineAudioContext(2,44100*40,44100);

})()

const SCALING = 100


class Point {
	constructor(x, y){
		this.x = x // m
		this.y = y // m
	}

	equivalent(other, error) {
		error = error || 0
		if ((Math.abs(this.x-other.x)<=error) && (Math.abs(this.y-other.y)<=error)) {
			return true
		} else {
			return false
		}
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

	collisionPoint(other) {
		// slope is Infinity for vertical lines
		if (this.slope===Infinity) {
			var x = this.p1.x
			var y = (other.slope*x) + other.c
		} else if (other.slope===Infinity) {
			var x = other.p1.x
			var y = (this.slope*x) + this.c
		} else {
			var x = (other.c-this.c) / (this.slope-other.slope)
			var y = (this.slope*x) + this.c
		}
		return new Point(x, y)
	}
}


class BasicPlane extends LineSegment {
	constructor(p1, p2, bounce) {
		super(p1, p2)
		this.bounce = bounce ? bounce : 1
	}

	applyForce(to_vect) {
		var tmp = to_vect.tilt(this.angle)
		// reverse perpendicular component * bounce factor
		tmp.y_vel *= (-1 * this.bounce)
		var new_vect = tmp.tilt(-1*this.angle)
		console.log(to_vect, tmp, new_vect, this.angle)
		return new_vect
	}

	isSurface(x, y) {
		return (y === (this.slope*x) + this.c)
	}

}



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
				this.surfaces.push(new BasicPlane(this.points[i], this.points[i-1], this.options.bounce || 0.9))
			}
		}

		canvas.fill()
		canvas.stroke()
		canvas.closePath()
	}
}



class Projectile {
	constructor(center, color, velocity) {
		this.center = center
		this.nextCenter = center
		this.color = color
		this.velocity = velocity
		this.timestamp = new Date()
	}

	isSurface(x, y) {
		return ((this.center.x===x) && (this.center.y==y))
	}


	computeNextPosition(props) {
		var newstamp = new Date()
		var timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
		// apply gravity
		this.velocity.y_vel += (9.81 * timedelta * SCALING)
		this.nextCenter = this.velocity.getNextPosition(this.center, timedelta)

		props.forEach(p=>{
			if (p instanceof Obstacle) {
				p.surfaces.forEach(line=>{
					var does_intersect = doIntersect(this.center, this.nextCenter, line.p1, line.p2)
					if ((does_intersect==DOES_INTERSECT) || (does_intersect==COLLINEAR)) {
						if (does_intersect==DOES_INTERSECT) {
							console.clear()
							console.log("Bang!!", this.nextCenter, does_intersect)
							var path = new LineSegment(this.center, this.nextCenter)
							var point = path.collisionPoint(line)

							// step back by n pixels
							var tmpx = this.center.x - point.x
							var tmpy = this.center.y - point.y
							var backoff = 0.1

							if (Math.abs(tmpx)>=Math.abs(tmpy)) {
								var nx = point.x + (backoff*(tmpx/Math.abs(tmpx)))
								this.nextCenter = new Point(nx, (path.slope*nx)+path.c)
							} else {
								var ny = point.y + (backoff*(tmpy/Math.abs(tmpy)))
								var nx = (path.slope===Infinity) ? point.x : (ny - path.c)/path.slope // vertical fall has infinite slope
								this.nextCenter = new Point(nx, ny)
							}
						}
						this.velocity = line.applyForce(this.velocity)
						this.velocity.x_vel *=0.9 // resistance
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
		setTimeout(()=>this.runloop(), 15)
	}
}


