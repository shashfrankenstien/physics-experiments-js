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
			f: 0.96,
			v: getRandomBetween(0, 50) - 25,
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

			this.exp_y.v += (this.exp_y.g * this.exp_y.dt * this.exp_y.vd)
			this.exp_y.h -= ((this.exp_y.v/2) * this.exp_y.dt * this.exp_y.vd)

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
		return this.x + (this.exp_x.v * this.exp_x.vd)
		// return this.x + (this.exp_x.v * this.bounciness * this.exp_x.vd)
	}



	check_obstacle() {
		var t = this
		t.obstacles.static.forEach(s=>{
			const inHorizontalBand = this.y >= s.obj.y1 && this.y <= s.obj.y2
			const  inVerticalBand = this.x >= s.obj.x1 && this.x <= s.obj.x2

			if (inVerticalBand) {

				if (this.prev_y.y < this.y && (this.y+this.r) > s.obj.y1 && this.y < s.obj.y2) {
					console.log("click")
					this.bounce_y(this.yToMeters(s.obj.y1 - this.r))
				} else if (this.prev_y.y > this.y && (this.y-this.r) < s.obj.y2 && this.y > s.obj.y1)  {
					console.log("kick")
					this.bounce_y(this.yToMeters(s.obj.y2 + this.r))
					
				}
			}

			else if (inHorizontalBand) {
				if (this.prev_x.x < this.x && (this.x+this.r) > s.obj.x1 && this.x < s.obj.x2) {
					console.log("<<<")
					this.exp_x.vd *= -1
					this.x = s.obj.x1 - this.r
				} else if (this.prev_x.x > this.x && (this.x-this.r) < s.obj.x2 && this.x > s.obj.x1) {
					this.exp_x.vd *= -1
					this.x = s.obj.x2 + this.r
				}
			} 

			
		})
		return [this.x + (this.exp_x.v * this.exp_x.vd), this.metersToY(this.exp_y.h)]
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
			t.canvas.fillStyle = "grey";
			t.canvas.fillRect(x1, y1, x2-x1, y2-y1);
		}
		this.properties.static.push({type: 'block', obj: blk})
	}
	
	show() {
		this.canvas.clearRect(0, 0, this.canvas_elem.width, this.canvas_elem.height)
		this.properties.static.forEach(s=>s.obj.draw())
		this.balls.forEach((b)=>b.move_next(this.canvas))
		setTimeout(()=>this.show(), 30)
	}
}





var e = new Environment()

e.addBlock(100, window.innerHeight-300, window.innerWidth-400, window.innerHeight-100)
e.addBlock(300, 300, 400, 500)

var r = ()=>getRandomBetween(50, window.innerHeight -50)
e.addBall(50, 50)
e.addBall(r(), r(), getRandomBetween(10, 80), "red")
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

