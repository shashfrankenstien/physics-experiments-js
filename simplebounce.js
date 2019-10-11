// file:///home/shashankgopikrishna/projects/physicsjs/index.html

(function (){
	var canvas_elem = document.getElementById("canvas")
	canvas_elem.id = "canvas"
	canvas_elem.width = window.innerWidth
	canvas_elem.height = window.innerHeight

	// var audioCtx = new AudioContext();
	// var offlineCtx = new OfflineAudioContext(2,44100*40,44100);

})()


function isEmpty(obj) {
	for(var prop in obj) {
		if(obj.hasOwnProperty(prop))
			return false;
	}

	return true;
}

function getRandomBetween(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}


function copyObj(src) {
	return Object.assign({}, src);
}

function sound(src) {
	this.sound = document.createElement("audio");
	this.sound.src = src;
	this.sound.setAttribute("preload", "auto");
	this.sound.setAttribute("controls", "none");
	this.sound.style.display = "none";
	document.body.appendChild(this.sound);
	this.play = function(){
		this.sound.play();
	}
	this.stop = function(){
		this.sound.pause();
	}
}




function playSound(n) {
	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	var o = audioCtx.createOscillator()
	o.type = "triangle"
	o.frequency.setValueAtTime(NOTES[n], audioCtx.currentTime)
	o.connect(audioCtx.destination)
	o.start()
	o.stop(0.1)
}




class Ball {
	constructor(start_x, start_y, radius, color, environ_props) {
		this.r = radius
		this.c = color
		this.obstacles = environ_props
		this.start_x = start_x
		this.start_y = start_y

		this.x = start_x
		this.y = start_y

		// Conditions
		this.bounciness = 0.9

		this.prev_y = {}
		this.next_y = {}

		this.prev_x = {}
		this.next_x = {}

		this.scaled = {
			viewWidth: this.xToMeters(this.obstacles.viewWidth),
			radius: this.xToMeters(this.r)
		}
		// this.beeper = new sound('beep.wav')
	}

	metersToY(m) {
		var scaled = (this.obstacles.viewHeight * m) + this.r
		return this.obstacles.viewHeight - scaled
	}

	yToMeters(y) {
		var inverse = this.obstacles.viewHeight - (y + this.r)
		return inverse / this.obstacles.viewHeight
	}

	xToMeters(x) {
		return x / this.obstacles.viewHeight
	}

	metersToX(m) {
		return m * this.obstacles.viewHeight
	}


	bounce_y(at, obstacle_bounce) {
		var o_bounce = obstacle_bounce ? obstacle_bounce : 1
		this.next_y.vd *= -1
		this.next_y.v *= this.bounciness * o_bounce
		this.next_y.h = at

		// Apply x-axis friction
		this.next_x.v *= this.next_x.f
	}

	ex_props_y() {
		if (isEmpty(this.next_y)) {
			this.next_y = {
				m: 1, //kgrams
				g: 9.81, //m/s^2
				h: this.yToMeters(this.start_y), //meters
				v: 0, //m/sec
				st: new Date(),
				dt: 0,
				Ke:0,
				vd: +1,
				vect: 0,
			}
			// this.next_y.Pe = this.next_y.m * this.next_y.g * this.next_y.h
		} else {
			this.prev_y = copyObj(this.next_y)

			this.next_y.st = new Date()
			this.next_y.dt = (this.next_y.st.getTime() - this.prev_y.st.getTime())/1000

			this.next_y.v += (this.next_y.g * this.next_y.dt * this.next_y.vd)
			this.next_y.h -= ((this.next_y.v/2) * this.next_y.dt * this.next_y.vd)

			// this.next_y.Ke = this.next_y.m * (Math.pow(this.next_y.v, 2))/2
			// this.next_y.Pe = this.next_y.m * this.next_y.g * this.next_y.h

			this.next_y.vect = this.next_y.h - this.prev_y.h

			if (this.next_y.h < 0) {
				// Handle bounce
				this.bounce_y(0)
			}
		}

		// console.log(this.next_y.Pe + this.next_y.Ke)
		this.next_y.y = this.metersToY(this.next_y.h)
		return this.next_y.y
	}

	ex_props_x() {
		if (isEmpty(this.next_x)) {
			this.next_x = {
				f: 0.96,
				v: 1, //m/s
				h: this.xToMeters(this.start_x), //meters
				vd: +1,
				st: new Date(),
				dt: 0,
				vect: 0,
			}
			// this.next_y.Pe = this.next_y.m * this.next_y.g * this.next_y.h
		} else {
			this.prev_x = copyObj(this.next_x)

			this.next_x.st = new Date()
			this.next_x.dt = (this.next_x.st.getTime() - this.prev_x.st.getTime())/1000

			this.next_x.vect = (this.next_x.v * this.next_x.dt * this.next_x.vd)
			this.next_x.h += this.next_x.vect

			if ((this.next_x.h + this.scaled.radius) > this.scaled.viewWidth) {
				this.next_x.vd *= -1
				this.next_x.h = this.scaled.viewWidth - this.scaled.radius
			} else if ((this.next_x.h - this.scaled.radius )< 0) {
				this.next_x.vd *= -1
				this.next_x.h = this.scaled.radius
			}
		}
		this.next_x.x = this.metersToX(this.next_x.h)
		// console.log(this.next_x.x )
		return this.next_x.x
	}


	check_obstacle() {
		var t = this
		t.obstacles.static.forEach(s=>{
			const inHorizontalBand = this.y >= s.obj.y1 && this.y <= s.obj.y2
			const  inVerticalBand = this.x >= s.obj.x1 && this.x <= s.obj.x2

			if (inVerticalBand) {

				if (this.prev_y.y < this.y && (this.y+this.r) > s.obj.y1 && this.y < s.obj.y2) {
					console.log("click")
					this.bounce_y(this.yToMeters(s.obj.y1 - this.r), s.bounce)
				} else if (this.prev_y.y > this.y && (this.y-this.r) < s.obj.y2 && this.y > s.obj.y1)  {
					console.log("kick")
					this.bounce_y(this.yToMeters(s.obj.y2 + this.r), s.bounce)

				}
			}

			else if (inHorizontalBand) {
				if (this.prev_x.x < this.x && (this.x+this.r) > s.obj.x1 && this.x < s.obj.x2) {
					console.log("<<<")
					// playSound("A5")
					this.next_x.vd *= -1
					this.x = s.obj.x1 - this.r
				} else if (this.prev_x.x > this.x && (this.x-this.r) < s.obj.x2 && this.x > s.obj.x1) {
					console.log(">>>")
					// playSound("B5")
					this.next_x.vd *= -1
					this.x = s.obj.x2 + this.r
				}
			}


		})
		return [this.x + (this.next_x.v * this.next_x.vd), this.metersToY(this.next_y.h)]
	}


	move_next(canvas) {

		canvas.save()
		var grd = canvas.createRadialGradient(this.x, this.y, this.r/50, this.x, this.y+this.r, 3*this.r);
		grd.addColorStop(0, this.c);
		grd.addColorStop(1, "white");
		canvas.fillStyle = grd;

		canvas.beginPath();
		canvas.arc(this.x, this.y, this.r, 0, 2*Math.PI);
		canvas.fill();
		canvas.restore()

		this.y = this.ex_props_y()
		this.x = this.ex_props_x()
		var r = this.check_obstacle()
		this.x = r[0]
		this.y = r[1]

		if (!(this.next_x.v==0 && this.next_y.v==0)) {
			return true
		} else {
			return false
		}
	}
}


class Block {
	constructor(canvas, x, y, width, height, color, bounce) {
		this.color = color ? color : "grey"
		this.bounce = bounce ? bounce : 1
		this.obj = {
			x1:x,
			y1:y,
			x2:x+width,
			y2:y+height,
			w:width,
			h:height,
		}
		this.canvas = canvas
	}

	draw() {
		this.canvas.fillStyle = this.color;
		this.canvas.fillRect(this.obj.x1, this.obj.y1, this.obj.w, this.obj.h);
	}
}


class Trampoline extends Block {
	constructor(canvas, x, width, bounce) {
		var h = canvas.canvas.height
		super(canvas, x, h-5, width, 5, "red", bounce)
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
			static: []
		}
	}

	addBall(x, y, radius, color) {
		if (radius===undefined) radius = 30
		if (color===undefined) color = "blue"
		var b = new Ball(x, y, radius, color, this.properties)
		this.balls.push(b)
	}

	addBlock(x1, y1, x2, y2, bounce) {
		var blk = new Block(this.canvas, x1, y1, x2-x1, y2-y1)
		this.properties.static.push(blk)
	}

	addTrampoline(x, w, bounce) {
		var blk = new Trampoline(this.canvas, x, w, bounce)
		this.properties.static.push(blk)
	}

	show() {
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.properties.static.forEach(s=>s.draw())
		this.balls.forEach((b)=>b.move_next(this.canvas))
		setTimeout(()=>this.show(), 30)
	}
}





var e = new Environment()

e.addBlock(400, window.innerHeight-300, window.innerWidth-400, window.innerHeight-150)
// e.addBlock(550, 300, window.innerWidth-550, 400)
e.addTrampoline(50, 200, 1.5)
e.addTrampoline(window.innerWidth-250, 200, 1.5)

var r = ()=>getRandomBetween(50, window.innerHeight -50)
e.addBall(500, 100)
e.addBall(r(), r(), getRandomBetween(10, 80), "red")
e.addBall(r(), r(), getRandomBetween(10, 80), "green")
// e.addBall(r(), r(), getRandomBetween(10, 80), "grey")
// e.addBall(r(), r())
// e.addBall(r(), r(), getRandomBetween(10, 80), "purple")
// e.addBall(r(), r(), getRandomBetween(10, 80), "green")
// e.addBall(r(), r(), getRandomBetween(10, 80), "grey")
// e.addBall(r(), r())
// e.addBall(r(), r(), getRandomBetween(10, 80), "red")
// e.addBall(r(), r(), getRandomBetween(10, 80), "green")
// e.addBall(r(), r(), getRandomBetween(10, 80), "pink")

e.show()

