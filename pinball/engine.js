const SCALING = 100
const CANVAS_WIDTH = window.innerWidth
const CANVAS_HEIGHT = window.innerHeight

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

	passesBetween(a, b) {
		return doIntersect(a, b, this.p1, this.p2)
	}

	// containsPoint(p) {
	// 	return (p.x <= Math.max(this.p1.x, this.p2.x) && p.x >= Math.min(this.p1.x, this.p2.x) &&
	// 		p.y <= Math.max(this.p1.y, this.p2.y) && p.y >= Math.min(this.p1.y, this.p2.y))
	// }

	// willCollideWith(other) {
	// 	if (this.slope===other.slope) return null // Posible collinear, buwedoncare
	// 	// slope is Infinity for vertical lines
	// 	if (this.slope===Infinity) {
	// 		var x = this.p1.x
	// 		var y = (other.slope*x) + other.c
	// 	} else if (other.slope===Infinity) {
	// 		var x = other.p1.x
	// 		var y = (this.slope*x) + this.c
	// 	} else {
	// 		var x = (other.c-this.c) / (this.slope-other.slope)
	// 		var y = (this.slope*x) + this.c
	// 	}
	// 	var resp = new Point(x, y)
	// 	if (this.containsPoint(resp) && other.containsPoint(resp)) {
	// 		return resp
	// 	} else {
	// 		return null
	// 	}
	// }
}


class BasicPlane extends LineSegment {
	constructor(p1, p2, bounce) {
		super(p1, p2)
		this.bounce = bounce || 0.9 // Surfaces are not perfectly bouncy
	}

	applyForceToVector(to_vect) {
		var tmp = to_vect.tilt(this.angle)
		// reverse perpendicular component * bounce factor
		tmp.y_vel *= (-1 * this.bounce)
		tmp.x_vel *= 0.9 // resistance
		var new_vect = tmp.tilt(-1*this.angle)
		console.log(to_vect, tmp, new_vect, this.angle)
		return new_vect
	}

	doesCollideWith(obj) {
		// if (prev_dst_center.x!==this.nextCenter.x && prev_dst_center.y!==this.nextCenter.y) {
		// 	path = new LineSegment(this.center, this.nextCenter)
		// }
		// var point = path.willCollideWith(line)
		// if (point!==null) {
		// 	// console.clear()
		// 	// console.log("Bang!!", this.nextCenter, point)
		// 	// step back by n pixels
		// 	var tmpx = this.center.x - point.x
		// 	var tmpy = this.center.y - point.y
		// 	var backoff = 0.1
		// 	// console.log(tmpx, tmpy)
		// 	prev_dst_center = this.nextCenter
		// 	if (Math.abs(tmpx)>=Math.abs(tmpy)) {
		// 		var nx = point.x + (backoff*(tmpx/Math.abs(tmpx)))
		// 		this.nextCenter = new Point(nx, (path.slope*nx)+path.c)
		// 	} else {
		// 		var ny = point.y + (backoff*(tmpy/Math.abs(tmpy)))
		// 		var nx = (path.slope===Infinity) ? point.x : (ny - path.c)/path.slope // vertical fall has infinite slope
		// 		this.nextCenter = new Point(nx, ny)
		// 	}
		// 	this.velocity = line.applyForce(this.velocity)
		// 	this.velocity.x_vel *=0.9 // resistance
		// }

		// Working method
		var does_intersect = super.passesBetween(obj.center, obj.nextCenter)
		if ((does_intersect==DOES_INTERSECT) || (does_intersect==COLLINEAR)) {
			if (does_intersect==DOES_INTERSECT) {
				console.clear()
				console.log("Bang!!", obj.nextCenter, does_intersect)
				var path = new LineSegment(obj.center, obj.nextCenter)
				var point = path.collisionPoint(this)

				// step back by n pixels
				var tmpx = obj.center.x - point.x
				var tmpy = obj.center.y - point.y
				var backoff = 0.1

				if (Math.abs(tmpx)>=Math.abs(tmpy)) {
					var nx = point.x + (backoff*(tmpx/Math.abs(tmpx)))
					obj.nextCenter = new Point(nx, (path.slope*nx)+path.c)
				} else {
					var ny = point.y + (backoff*(tmpy/Math.abs(tmpy)))
					var nx = (path.slope===Infinity) ? point.x : (ny - path.c)/path.slope // vertical fall has infinite slope
					obj.nextCenter = new Point(nx, ny)
				}
				return point
			}
			// return true
			// obj.velocity.// resistance
			// throw new Error("Pause!")
		}
		return false
	}
}



class Obstacle {
	constructor(points, options) {
		this.points = points
		this.options = {
			bounce: options.bounce,
			lineWidth: options.lineWidth || '2',
			strokeColor: options.strokeColor || 'white',
			fillColor: options.fillColor || 'white',
		}
		this.surfaces = this._createSurfaces()

	}

	_createSurfaces() {
		let surf = []
		for(var i=1; i<this.points.length; i++) {
			// i begins from 1
			surf.push(new BasicPlane(this.points[i], this.points[i-1], this.options.bounce))
		}
		return surf
	}

	draw(canvas) {
		canvas.beginPath() // Start a new path.
		canvas.lineWidth = this.options.lineWidth
		canvas.strokeStyle = this.options.strokeColor
		canvas.fillStyle = this.options.fillColor

		for(let i=0; i<this.points.length; i++) {
			if (i===0) {
				canvas.moveTo(this.points[i].x, this.points[i].y)
			} else {
				canvas.lineTo(this.points[i].x, this.points[i].y)
			}
		}
		canvas.fill()
		canvas.stroke()
		canvas.closePath()
	}
}


class Paddle extends Obstacle {
	constructor(points, options) {
		if (options.pivotIndex===undefined) throw new Error("Paddle - missing 'pivotIndex' option")
		if (options.pivotIndex>=points.length) throw new Error("Paddle - 'pivotIndex' should be in 'points'")
		if (options.keyCode===undefined) throw new Error("Paddle - missing 'keyCode' option")
		super(points, options)
		this.move = false
		this.pressed = false
		this.direction = 1
		this.options.keyCode = options.keyCode
		this.options.pivotIndex = options.pivotIndex
		this.options.paddleSpeed = options.paddleSpeed || 100 // degrees/sec
		this.options.maxRotation = options.maxRotation || 90 // degrees
		// When ro
		this.options.clockwise = (options.clockwise===undefined) ? true : options.clockwise
		this.anticlockwise_modifier = this.options.clockwise ? 1 : -1

		this.normalAngles = {}
		for(let i=0; i<this.points.length; i++) {
			if (i!==this.options.pivotIndex) {
				let pivot = this.points[this.options.pivotIndex]
				let endpoint = this.points[i]
				let l = new LineSegment(pivot, endpoint)
				this.normalAngles[i] = this._computeNormalAngle(pivot, endpoint, l.angle)
			}
		}

		window.addEventListener("keydown", ev=>this._handleKeyPress(ev))
		window.addEventListener("keyup", ev=>this._handleKeyPress(ev))
		this.timestamp = null
	}

	_handleKeyPress(event) {
		if (this.options.keyCode==event.keyCode) {
			this.move = true
			this.timestamp = new Date()
			if (event.type==="keydown") {
				this.direction = 1 * this.anticlockwise_modifier
			} else {
				this.direction = -1 * this.anticlockwise_modifier
			}
		}
	}

	_computeNormalAngle(pivot, endpoint, angle) {
		// compte normal angle based on quadrant
		let normalAngle = Math.round(angle*1000) / 1000
		if (normalAngle <= 0) {
			if (endpoint.x >= pivot.x) {
				// top right quadrant
				normalAngle = 360 + normalAngle
			} else {
				// bottom left quadrant
				normalAngle = 180 + normalAngle
			}
		} else {
			if (endpoint.y <= pivot.y) {
				// top left quadrant (inverted y)
				normalAngle = 180 + normalAngle
			} else {
				//bottom right quadrant
				// no change
			}
		}
		return normalAngle % 360
	}


	_updatePosition() {
		if (this.timestamp===null) {
			this.timestamp = new Date()
			return null
		}
		if (this.move) {
			for(let i=0; i<this.points.length; i++) {
				if (i!==this.options.pivotIndex) {
					let pivot = this.points[this.options.pivotIndex]
					let endpoint = this.points[i]
					let l = new LineSegment(pivot, endpoint)
					let limit = (this.normalAngles[i] + this.options.maxRotation * this.anticlockwise_modifier)
					// corrections for zero crossing sweep
					if (limit >= 360) {
						var norm = 360 + l.angle
					} else if (limit < 0) {
						var norm = l.angle
					} else {
						var norm = this._computeNormalAngle(pivot, endpoint, l.angle)
					}

					let newstamp = new Date()
					let timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
					let newAngle = (norm + (timedelta * this.options.paddleSpeed * this.direction))

					let remainingDist = (limit - newAngle) * this.anticlockwise_modifier
					if (remainingDist <= 0) {
						newAngle = limit
						remainingDist = 0
						// throw new Error("Pause!")
					}
					let coveredDist = (newAngle - this.normalAngles[i]) * this.anticlockwise_modifier
					if (coveredDist <= 0) {
						newAngle = this.normalAngles[i]
						this.move = false
					}
					// console.log(this.normalAngles[i], newAngle, norm, l.angle)
					// console.log(remainingDist, coveredDist, this.options.maxRotation, this.direction)
					// console.log("-------")
					let angleRad = degToRadians(newAngle.mod(360))
					let x = pivot.x + (l.len * Math.cos(angleRad))
					let y = pivot.y + (l.len * Math.sin(angleRad))
					// rounding to remove float precision errors
					this.points[i] = new Point(Math.round(x), Math.round(y))
					// throw new Error("Pause!")
				}
			}
			super.surfaces = super._createSurfaces() // Recreating surfaces for collision detection
		}
	}

	draw(canvas) {
		this._updatePosition()
		super.draw(canvas)
	}
}



class Projectile {
	constructor(center, color, velocity) {
		this.center = center
		this.nextCenter = center
		this.color = color
		this.velocity = velocity
		this.timestamp = null
	}

	_computeNextPosition(props) {
		if (this.timestamp===null) {
			this.timestamp = new Date()
			return null
		}
		let newstamp = new Date()
		let timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
		// apply gravity
		this.velocity.y_vel += (9.81 * timedelta * SCALING)
		this.nextCenter = this.velocity.getNextPosition(this.center, timedelta)

		props.forEach(p=>{
			if (p instanceof Obstacle) {
				p.surfaces.forEach(surface=>{
					if (surface.doesCollideWith(this)) {
						this.velocity = surface.applyForceToVector(this.velocity)
					}
				})
			}
		})
		this.timestamp = newstamp
	}

	draw(canvas, props) {
		canvas.lineWidth = "4"
		canvas.strokeStyle = this.color
		canvas.rect(this.nextCenter.x, this.nextCenter.y, 1, 1)
		canvas.stroke()
		this.center = this.nextCenter
		this._computeNextPosition(props)
		// canvas.fillStyle = this.color
		// canvas.fillRect(this.center.x, this.center.y, 1, 1)
	}
}


class Environment {
	constructor() {
		this.canvas_elem = document.getElementById("canvas")
		this.canvas = this.canvas_elem.getContext('2d')
		this.balls = []
		this.obstacles = []
	}

	addObstacle(obs) {
		this.obstacles.push(obs)
	}

	addProjectile(pro) {
		this.balls.push(pro)
	}

	draw() {
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.obstacles.forEach(s=>s.draw(this.canvas, this.balls))
		this.balls.forEach((b)=>b.draw(this.canvas, this.obstacles))
	}

	runloop() {
		// var loop_start = new Date()
		this.draw()
		// var loop_end = new Date()
		// var diff = (loop_end.getTime() - loop_start.getTime())
		// console.log(diff)
		setTimeout(()=>this.runloop(), 15)
	}
}


