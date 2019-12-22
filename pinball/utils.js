
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

// function sound(src) {
// 	this.sound = document.createElement("audio");
// 	this.sound.src = src;
// 	this.sound.setAttribute("preload", "auto");
// 	this.sound.setAttribute("controls", "none");
// 	this.sound.style.display = "none";
// 	document.body.appendChild(this.sound);
// 	this.play = function(){
// 		this.sound.play();
// 	}
// 	this.stop = function(){
// 		this.sound.pause();
// 	}
// }


// function playSound(n) {
// 	var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// 	var o = audioCtx.createOscillator()
// 	o.type = "triangle"
// 	o.frequency.setValueAtTime(NOTES[n], audioCtx.currentTime)
// 	o.connect(audioCtx.destination)
// 	o.start()
// 	o.stop(0.1)
// }



function degToRadians(deg) {
	return deg * (Math.PI / 180.0)
}


function radiansToDeg(rad) {
	return rad * (180.0 / Math.PI)
}


function onSegment(p, q, r) {
	if (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
		q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y)) {
		return true
	}
	return false
}

// To find orientation of ordered triplet (p, q, r).
// The function returns following values
// 0 --> p, q and r are colinear
// 1 --> Clockwise
// -1 --> Counterclockwise
function orientation(p, q, r) {
	// See https://www.geeksforgeeks.org/orientation-3-ordered-points/
	// for details of below formula.
	var val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)

	if (val == 0) return 0  // colinear
	return (val > 0)? 1: -1 // clock or counterclock wise
}

// The main function that returns true if line segment 'p1q1'
// and 'p2q2' intersect.
function doIntersect(p1, q1, p2, q2) {
	// Find the four orientations needed for general and
	// special cases
	var o1 = orientation(p1, q1, p2)
	var o2 = orientation(p1, q1, q2)
	var o3 = orientation(p2, q2, p1)
	var o4 = orientation(p2, q2, q1)

	// General case
	if (o1 != o2 && o3 != o4) return o1

	// Special Cases
	// p1, q1 and p2 are colinear and p2 lies on segment p1q1
	if (o1 == 0 && onSegment(p1, p2, q1)) return o1

	// p1, q1 and q2 are colinear and q2 lies on segment p1q1
	if (o2 == 0 && onSegment(p1, q2, q1)) return o1

	// p2, q2 and p1 are colinear and p1 lies on segment p2q2
	if (o3 == 0 && onSegment(p2, p1, q2)) return o1

		// p2, q2 and q1 are colinear and q1 lies on segment p2q2
	if (o4 == 0 && onSegment(p2, q1, q2)) return o1

	// return false // Doesn't fall in any of the above cases
	throw new Error("no intersection")
}
