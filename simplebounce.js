// file:///home/shashankgopikrishna/projects/physicsjs/index.html

(function (){
	var canvas_elem = document.getElementById("canvas")
	canvas_elem.id = "canvas"
	canvas_elem.width = window.innerWidth
	canvas_elem.height = window.innerHeight
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





class Ball {
	constructor(start_x, start_y, radius, color, environ_props) {
		this.r = radius
		this.c = color
		this.obstacles = environ_props
		this.starting_height = start_y
		
		this.x = start_x
		this.y = start_y

		// Conditions
		this.bounciness = 0.9

		this.prev_y = {}
		this.exp_y = {}
		this.prev_x = {}
		this.exp_x = {
			f: 0.98,
			v: 1,//getRandomBetween(0, 100) - 25,
			vd: 1,
		}
		this.beeper = new sound('beep.wav')
	}

	metersToY(m) {
		var scaled = (this.obstacles.viewHeight * m) + this.r
		return this.obstacles.viewHeight - scaled
	}

	yToMeters(y) {
		var inverse = this.obstacles.viewHeight - (y + this.r)
		return inverse / this.obstacles.viewHeight
	}


	bounce_y(at) {
		this.exp_y.vd *= -1
		this.exp_y.v *= this.bounciness
		this.exp_y.h = at
		
		// Apply x-axis friction
		this.exp_x.v *= this.exp_x.f
	}

	ex_props_y() {
		if (isEmpty(this.exp_y)) {
			this.exp_y = {
				m: 1, //kgrams
				g: 9.81, //m/s^2
				h: this.yToMeters(this.starting_height), //meters
				v: 0, //m/sec
				st: new Date(),
				dt: 0,
				Ke:0,
				vd: +1,
			}
			this.exp_y.Pe = this.exp_y.m * this.exp_y.g * this.exp_y.h
		} else {
			this.prev_y = copyObj(this.exp_y)
			this.prev_y.y = this.y

			var st = new Date()
			this.exp_y.dt = (st.getTime() - this.exp_y.st.getTime())/1000
			this.exp_y.st = st

			var new_v = this.exp_y.v + (this.exp_y.g * this.exp_y.dt * this.exp_y.vd)
			this.exp_y.h -= ((new_v/2) * this.exp_y.dt * this.exp_y.vd)
			this.exp_y.v = new_v

			this.exp_y.Ke = this.exp_y.m * (Math.pow(this.exp_y.v, 2))/2
			this.exp_y.Pe = this.exp_y.m * this.exp_y.g * this.exp_y.h

			if (this.exp_y.h < 0) {
				// Handle bounce
				this.bounce_y(0)
			}
		}
		
		// console.log(this.exp_y.Pe + this.exp_y.Ke)
		return this.metersToY(this.exp_y.h)
	}

	ex_props_x() {
		this.prev_x = copyObj(this.exp_x)
		this.prev_x.x = this.x

		if (this.x+this.r > this.obstacles.viewWidth) {
			this.exp_x.vd *= -1
			this.x = this.obstacles.viewWidth - this.r
		} else if (this.x-this.r < 0) {
			this.exp_x.vd *= -1
			this.x = this.r
		}
		return this.x + (this.exp_x.v * this.bounciness * this.exp_x.vd)
	}



	check_obstacle() {
		var t = this
		t.obstacles.static.forEach(s=>{
			if (this.y >= s.obj.y1 && this.y <= s.obj.y2) {
				if ((this.prev_x.x+this.r) < s.obj.x1 && (this.x+this.r) > s.obj.x1 && this.x < s.obj.x2) {
					this.exp_x.vd *= -1
					this.x = s.obj.x1 - this.r
				} else if ((this.prev_x.x-this.r) > s.obj.x2 && (this.x-this.r) < s.obj.x2 && this.x > s.obj.x1) {
					this.exp_x.vd *= -1
					this.x = s.obj.x2 + this.r
				}
			} 

			if (this.x+this.r >= s.obj.x1 && this.x-this.r <= s.obj.x2) {
				// console.log(this.y)
				var y_vd = this.exp_y.vd * (this.exp_y.v/Math.abs(this.exp_y.v))
				

				if (this.prev_y.y < this.y && (this.y+this.r) > s.obj.y1 && this.y < s.obj.y2) {
					console.log("click")
					// this.bounce_y(this.yToMeters(s.obj.y1 - this.r))
					this.exp_y.vd *= -1
					this.exp_y.v *= this.bounciness
					this.exp_y.h = this.yToMeters(s.obj.y1 - this.r)
				} else if (this.exp_y.vd < 0)  {
					
				}
			}
		})
	}


	move_next(canvas) {

		// this.check_obstacle()

		this.check_obstacle()
		this.y = this.ex_props_y()
		this.x = this.ex_props_x()


		canvas.save()
		var grd = canvas.createRadialGradient(this.x, this.y, this.r/50, this.x, this.y+this.r, 3*this.r);
		grd.addColorStop(0, this.c);
		grd.addColorStop(1, "white");
		canvas.fillStyle = grd;

		canvas.beginPath();
		canvas.arc(this.x, this.y, this.r, 0, 2*Math.PI);
		canvas.fill(); 
		canvas.restore()

		if (!(this.exp_x.v==0 && this.exp_y.v==0)) {
			return true
		} else {
			return false
		}
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
		var bounce = bounce ? bounce : 1
		var t = this
		var blk = {x1, y1, x2, y2}
		blk.draw = ()=>{
			t.canvas.strokeStyle = "grey";
			// t.canvas.fillRect(x1, y1, x2, y2);
			t.canvas.strokeRect(x1, y1, x2-x1, y2-y1);
			t.canvas.beginPath();
			t.canvas.arc(x1, y1, 10, 0, 2*Math.PI);
			t.canvas.stroke(); 
			t.canvas.beginPath();
			t.canvas.arc(x2, y2, 10, 0, 2*Math.PI);
			t.canvas.stroke();
		}
		// blk.contact = (x, y)=>{
		// 	if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
		// 		const dx1 = x-x1
		// 		const dx2 = x2-x
		// 		const dy1 = y-y1
		// 		const dy2 = y2-y
		// 		const m = Math.min(dx1, dx2, dy1, dy2)
		// 		console.log("================")
		// 		console.log(x1, y1, x2, y2)
		// 		console.log(x, y)
		// 		if (m===dx1) {
		// 			console.log("Vertical")
		// 			return {x:x1, y:y, bx:-1, by:1}
		// 		} else if (m===dx2) {
		// 			console.log("Vertical")
		// 			return {x:x2, y:y, bx:-1, by:1}
		// 		} else if (m===dy1) {
		// 			console.log("Horizontal")
		// 			return {x:x, y:y1, bx:1, by:-1}
		// 		} else {
		// 			console.log("Horizontal")
		// 			return {x:x, y:y2, bx:1, by:-1}
		// 		}
		// 	} else {
		// 		// console.log(x1, x, x2, y1, y, y2)
		// 		return null
		// 	}
		// }
		this.properties.static.push({type: 'block', obj: blk})
	}
	
	show() {
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.properties.static.forEach(s=>s.obj.draw())
		this.balls.forEach((b)=>b.move_next(this.canvas))
		// this.balls[0].ex_props()
		setTimeout(()=>this.show(), 40)
	}
}

// var b = new Ball(50, 40)
// b.bounce()

var e = new Environment()

e.addBlock(window.innerWidth-700, window.innerHeight-200, window.innerWidth-300, window.innerHeight)
// e.addBlock(300, 300, 400, 500)

var r = ()=>getRandomBetween(50, window.innerHeight -50)
e.addBall(50, 50)
// e.addBall(r(), r(), getRandomBetween(10, 80), "red")
// e.addBall(r(), r(), getRandomBetween(10, 80), "green")
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

