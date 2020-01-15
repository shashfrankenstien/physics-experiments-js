"use strict";

const SCALING = 100
const CANVAS_WIDTH = window.innerWidth
const CANVAS_HEIGHT = window.innerHeight


class Point {
	constructor(x, y){
		this.x = x // m
		this.y = y // m
	}

	copy() {
		return new Point(this.x, this.y)
	}

	distance2From(other) {
		return Math.pow(other.y-this.y, 2) + Math.pow(other.x-this.x, 2)
	}

	distanceFrom(other) {
		return Math.sqrt(this.distance2From(other))
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


class GenericVector {
	constructor(x_component, y_component) {
		this.x_component = x_component // m/s
		this.y_component = y_component // m/s
	}

	getMagnitude() {
		return Math.sqrt(Math.pow(this.y_component, 2) + Math.pow(this.x_component, 2))
	}

	tilt(theta) {
		var t = degToRadians(theta)
		var Xx_vel = Math.cos(t) * this.x_component
		var Yx_vel = Math.sin(t) * this.x_component * -1 // y is inverted on browser

		var Xy_vel = Math.sin(t) * this.y_component
		var Yy_vel = Math.cos(t) * this.y_component

		this.x_component = Xx_vel+Xy_vel,
		this.y_component = Yx_vel+Yy_vel
	}
}

class VelocityVector extends GenericVector {
	constructor(x_component, y_component, mass) {
		super(x_component, y_component)
		this.mass = mass || 1
	}

	_applyGravity(timedelta) {
		this.y_component += (this.mass * 9.81 * timedelta * SCALING)
	}

	getNextPosition(pos, timedelta) {
		/* A velocity vector will always be affected by gravity
		* Applying gravity to y before computing next position */
		this._applyGravity(timedelta)
		var x = pos.x + (this.x_component * timedelta)
		var y = pos.y + (this.y_component * timedelta)
		return new Point(x, y)
	}
}


class LineSegmentLite {
	constructor(p1, p2) {
		this.p1 = p1
		this.p2 = p2

		this._xdelta = this.p2.x-this.p1.x
		this._ydelta = this.p2.y-this.p1.y

		this.slope = (this._ydelta) / (this._xdelta)
		this.c = this.p1.y - (this.slope*this.p1.x)
	}

	get_y(x) {
		return (this.slope*x) + this.c
	}

	get_x(y) {
		return (y - this.c)/this.slope
	}

	intersectionPoint(other) {
		// slope is Infinity for vertical lines
		if (Math.abs(this.slope)===Infinity) {
			var x = this.p1.x
			var y = other.get_y(x)
		} else if (Math.abs(other.slope)===Infinity) {
			var x = other.p1.x
			var y = this.get_y(x)
		} else {
			var x = (other.c-this.c) / (this.slope-other.slope)
			var y = this.get_y(x)
		}
		return new Point(x, y)
	}

	passesBetween(a, b) {
		return (doIntersect(a, b, this.p1, this.p2)===DOES_INTERSECT) // can also be DOES_NOT_INTERSECT, COLLINEAR
	}

	inclinationFrom(other) {
		const rel_slope = Math.abs((other.slope-this.slope) / (1+(other.slope*this.slope)))
		return Math.atan(rel_slope) // in radians
	}
}



class LineSegment extends LineSegmentLite {
	// Calculates length and angle of inclination at construction
	constructor(p1, p2) {
		super(p1, p2)
		this.len2 = this.p1.distance2From(this.p2)
		this.len = Math.sqrt(this.len2)
		this.angle = radiansToDeg(Math.atan(this.slope)) // angle of inclination (-90 to 90)
	}

	perpendicularDistance(p) {
		// tan θ = ∣m2−m1/1+m1m2∣
		const l_p2 = new LineSegment(p, this.p2)
		return l_p2.len * Math.sin(this.inclinationFrom(l_p2))
	}

	projectionRatio(p) {
		// projection ratio is between 0 and 1 if projection is within segment
		return ((p.x - this.p1.x) * this._xdelta + (p.y - this.p1.y) * this._ydelta) / this.len2
	}

	pointOrientation(p) {
		return orientation(this.p1, this.p2, p)
	}
}



class Obstacle {
	constructor(points, options) {
		options = options || {}
		this.points = points
		this.options = {
			bounce: options.bounce || 0.9, // 90 %
			resistance: options.resistance || 0.1, // 10 %
			lineWidth: options.lineWidth || '2',
			strokeColor: options.strokeColor || 'white',
			fill: (options.fill===undefined) ? true : options.fill,
			fillColor: options.fillColor || 'white',
		}
		this.surfaces = this._createSurfaces()
		this.event_listeners = {}
	}

	_createSurfaces() {
		let surf = []
		// handle only 2 points - create p0 to p1 and avoid p1 to p0
		if (this.points.length==2) {
			surf.push(new LineSegment(this.points[0], this.points[1]))
		} else {
			for(var i=0; i<this.points.length; i++) {
				let s = new LineSegment(this.points[i], this.points[(i+1).mod(this.points.length)])
				surf.push(s)
			}
		}
		return surf
	}

	addEventListener(event, func) {
		this.event_listeners[event] = func
	}


	_emitCollisionEvent(surface, colliding_obj) {
		if (this.event_listeners['collision']) [
			this.event_listeners['collision'](surface, colliding_obj)
		]
	}


	_paintCanvas(canvas) {
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
		if (this.options.fill) canvas.fill()
		canvas.closePath()
		canvas.stroke()
	}

	draw(canvas, props) {
		this._paintCanvas(canvas)
		for (let pid=0; pid<props.length; pid++) {
			let projectile = props[pid]
			if (projectile instanceof Projectile) {
				for (let sid=0; sid<this.surfaces.length; sid++) {
					let surface = this.surfaces[sid]
					let pr = surface.projectionRatio(projectile.nextCenter)
					let on_line = (pr>=0) && (pr<=1)
					if (!on_line) {
						continue
					}

					let prev_orient = surface.pointOrientation(projectile.center)
					let cur_orient = surface.pointOrientation(projectile.nextCenter)
					if(prev_orient===cur_orient) continue // detect change in orientation

					// If orientation did change
					let travel_path = new LineSegmentLite(projectile.center, projectile.nextCenter)
					projectile.nextCenter = travel_path.intersectionPoint(surface)
					projectile.nextCenter = projectile.backupNextCenterBy(0.1, travel_path)
					// mutate the velocity vector
					projectile.velocity.tilt(surface.angle)
					projectile.velocity.y_component *= (-1 * this.options.bounce) // reverse perpendicular component * bounce factor
					projectile.velocity.x_component *= (1 - this.options.resistance) // drop x velocity by resistance
					projectile.velocity.tilt(-1*surface.angle)
					this._emitCollisionEvent(surface, projectile)

				}
			}
		}
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

	backupNextCenterBy(steps, travel_path) {
		// step back by some pixels
		var delta_x = this.center.x - this.nextCenter.x
		var delta_y = this.center.y - this.nextCenter.y

		if (Math.abs(delta_x)>=Math.abs(delta_y)) {
			var nx = this.nextCenter.x + (steps*(delta_x/Math.abs(delta_x)))
			var ny = travel_path.get_y(nx)
		} else {
			var ny = this.nextCenter.y + (steps*(delta_y/Math.abs(delta_y)))
			var nx = (Math.abs(travel_path.slope)===Infinity) ? this.nextCenter.x : travel_path.get_x(ny) // vertical fall has infinite slope
		}
		return new Point(nx, ny)
	}

	_precomputeNextPosition() {
		this.center = this.nextCenter.copy()
		if (this.timestamp===null) {
			this.timestamp = new Date()
			return null
		}
		let newstamp = new Date()
		let timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
		this.nextCenter = this.velocity.getNextPosition(this.center, timedelta)
		this.timestamp = newstamp
	}

	draw(canvas) {
		// Displays current position, then computes new position
		canvas.beginPath() // Start a new path.
		canvas.lineWidth = "4"
		canvas.strokeStyle = this.color
		canvas.rect(this.nextCenter.x, this.nextCenter.y, 1, 1) //Dot
		canvas.stroke()
		canvas.closePath()
		this._precomputeNextPosition()
		// canvas.fillStyle = this.color
		// canvas.fillRect(this.center.x, this.center.y, 1, 1)
	}
}



///////////////////////////////////////////////////////////////////////////////
/////////////////////////////PINBALL COMPONENTS////////////////////////////////
///////////////////////////////////////////////////////////////////////////////




class Paddle extends Obstacle {
	constructor(points, options) {
		if (options.pivotIndex===undefined) throw new Error("Paddle - missing 'pivotIndex' option")
		if (options.pivotIndex>=points.length) throw new Error("Paddle - 'pivotIndex' should be in 'points'")
		if (options.keyCode===undefined) throw new Error("Paddle - missing 'keyCode' option")
		super(points, options)
		this.moving = false
		this.direction = 1
		this.options.keyCode = options.keyCode
		this.options.pivotIndex = options.pivotIndex
		this.options.maxRotation = options.maxRotation || 90 // degrees
		this.options.maxPaddleSpeed = options.maxPaddleSpeed || 600 // degrees/sec
		this.options.clockwise = (options.clockwise===undefined) ? true : options.clockwise
		this.paddleSpeed = this.options.maxPaddleSpeed
		this.anticlockwise_modifier = this.options.clockwise ? 1 : -1

		this.pivot_point = this.points[this.options.pivotIndex] // pivot point is always fixed
		this.normalAngles = {}
		for(let i=0; i<this.points.length; i++) {
			if (i!==this.options.pivotIndex) {
				let l = new LineSegment(this.pivot_point, this.points[i])
				this.normalAngles[i] = this._computeNormalAngle(this.pivot_point, this.points[i], l.angle)
			}
		}

		window.addEventListener("keydown", ev=>this._handleKeyPress(ev))
		window.addEventListener("keyup", ev=>this._handleKeyPress(ev))

		this.timestamp = null
	}

	_handleKeyPress(event) {
		if (this.options.keyCode==event.keyCode) {
			this.moving = true
			this.timestamp = new Date()
			if (event.type==="keydown") {
				this.paddleSpeed = this.options.maxPaddleSpeed
				this.direction = 1 * this.anticlockwise_modifier
			} else { // keyup
				this.paddleSpeed = this.options.maxPaddleSpeed / 2 // reduce paddle return speed
				this.direction = -1 * this.anticlockwise_modifier
			}
		}
	}

	_computeNormalAngle(pivot, endpoint, inclination) {
		// compute normal angle based on quadrant
		let normalAngle = Math.round(inclination*1000) / 1000
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
			}
			// else { /*bottom right quadrant - no change*/ }
		}
		return normalAngle.mod(360)
	}


	_computeNewSurfaces() {
		if (this.timestamp===null) {
			this.timestamp = new Date()
			return this.surfaces
		}
		var newstamp = new Date()
		for(let i=0; i<this.points.length; i++) {
			if (i===this.options.pivotIndex) continue
			let endpoint = this.points[i]
			let l = new LineSegment(this.pivot_point, endpoint)
			let limit = (this.normalAngles[i] + this.options.maxRotation * this.anticlockwise_modifier)
			// corrections for zero crossing sweep
			if (limit >= 360) {
				var norm = 360 + l.angle
			} else if (limit < 0) {
				var norm = l.angle
			} else {
				var norm = this._computeNormalAngle(this.pivot_point, endpoint, l.angle)
			}

			newstamp = new Date()
			let timedelta = (newstamp.getTime() - this.timestamp.getTime())/1000
			let newAngle = (norm + (timedelta * this.paddleSpeed * this.direction))

			let remainingDist = (limit - newAngle) * this.anticlockwise_modifier
			if (remainingDist <= 0) {
				newAngle = limit
				remainingDist = 0
				// throw new Error("Pause!")
			}
			let offsetDist = (newAngle - this.normalAngles[i]) * this.anticlockwise_modifier
			if (offsetDist <= 0) {
				newAngle = this.normalAngles[i]
				this.moving = false
			}
			let angleRad = degToRadians(newAngle.mod(360))
			let x = this.pivot_point.x + (l.len * Math.cos(angleRad))
			let y = this.pivot_point.y + (l.len * Math.sin(angleRad))
			this.points[i] = new Point(x, y)
			// throw new Error("Pause!")
		}
		this.timestamp = newstamp
		return super._createSurfaces() // Recreating surfaces for collision detection
	}

	_surfaceMovingTowards(surface, pnt) {
		return orientation(surface.p1, surface.p2, pnt)*this.direction===1
	}


	draw(canvas, props) {
		// Computes and displays new position
		if (!this.moving) {
			super.draw(canvas, props)
			return
		}
		const new_surfaces = this._computeNewSurfaces()
		let did_move = false
		for (let i=0;i<new_surfaces.length;i++){
			if(new_surfaces[i].inclinationFrom(this.surfaces[i])!==0) {
				did_move = true
				break
			}
		}
		if (!did_move) {
			super.draw(canvas, props)
			return
		}

		// did move
		props.forEach(projectile=>{
			const travel_path = new LineSegment(projectile.center, projectile.nextCenter)
			for (let i=0; i<this.surfaces.length; i++) {

				let pr = new_surfaces[i].projectionRatio(projectile.nextCenter)
				let on_line = (pr>=0) && (pr<=1)
				if (!on_line) {
					continue
				}

				let proj_prev_orient = new_surfaces[i].pointOrientation(projectile.center)
				let proj_new_orient = new_surfaces[i].pointOrientation(projectile.nextCenter)

				let surf_prev_orient = this.surfaces[i].pointOrientation(projectile.nextCenter)
				let surf_new_orient = new_surfaces[i].pointOrientation(projectile.nextCenter)

				if (
					surf_new_orient !== surf_prev_orient
					|| proj_new_orient !== proj_prev_orient
					) {
					console.log("COLLISION!!!!!")
					let perp_dist_old = this.surfaces[i].perpendicularDistance(projectile.nextCenter)
					let perp_dist_new = new_surfaces[i].perpendicularDistance(projectile.nextCenter)
					let surf_offset_ratio = perp_dist_new / (perp_dist_new + perp_dist_old)

					let travel_path = new LineSegment(projectile.center, projectile.nextCenter)
					let collision_point = projectile.backupNextCenterBy(travel_path.len*surf_offset_ratio, travel_path)
					projectile.nextCenter = collision_point

					let omega = degToRadians( this.paddleSpeed * this.direction ) // angular velocity
					let radiusLine = new LineSegment(this.pivot_point, collision_point)
					let v = new VelocityVector(omega*radiusLine.len, 0) // angular velocity for radius
					let tilt_angle = (90-radiusLine.angle)
					v.tilt(tilt_angle)

					// console.log(projectile.velocity)
					// console.log('v', v)

					let new_vx = projectile.velocity.x_component + v.x_component * this.anticlockwise_modifier
					let new_vy = projectile.velocity.y_component + v.y_component * this.anticlockwise_modifier
					projectile.velocity.x_component = median([projectile.velocity.x_component, v.x_component*this.anticlockwise_modifier, new_vx])
					projectile.velocity.y_component = median([projectile.velocity.y_component, v.y_component*this.anticlockwise_modifier, new_vy])

					// console.log(projectile.velocity)
					// console.log('radiusLine.angle', radiusLine.angle)
					// console.log('tilt_angle', tilt_angle)
					// console.log('omega', omega)
					// throw new Error("Pause")
				}
			}
		})
		this.surfaces = new_surfaces
		super._paintCanvas(canvas)
	}
}




class Environment {
	constructor() {
		this.canvas_elem = document.getElementById("canvas")
		this.canvas = this.canvas_elem.getContext('2d')
		this.balls = []
		this.obstacles = []
		this.runloop = this.runloop.bind(this) // explicit bind this so that it can be called from requestAnimationFrame
	}

	addObstacle(obs) {
		this.obstacles.push(obs)
	}

	addProjectile(pro) {
		this.balls.push(pro)
	}

	draw() {
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.balls.forEach((b)=>b.draw(this.canvas))
		this.obstacles.forEach((s)=>s.draw(this.canvas, this.balls))
	}

	runloop() {
		// var loop_start = new Date()
		this.draw()
		// var loop_end = new Date()
		// var diff = (loop_end.getTime() - loop_start.getTime())
		// console.log(diff)
		requestAnimationFrame(this.runloop)
	}
}
