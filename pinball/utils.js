// constants
const LEFTKEY = 37
const RIGHTKEY = 39
const DOWNKEY = 40

const DOES_NOT_INTERSECT = 0
const DOES_INTERSECT = 1
const COLLINEAR = 2

Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}


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


function equalObjects(a, b) {
	// Create arrays of property names
	var aProps = Object.getOwnPropertyNames(a);
	var bProps = Object.getOwnPropertyNames(b);
	// If number of properties is different,
	// objects are not equivalent
	if (aProps.length != bProps.length) {
		return false;
	}
	for (var i = 0; i < aProps.length; i++) {
		var propName = aProps[i];
		// If values of same property are not equal,
		// objects are not equivalent
		if (a[propName] !== b[propName]) {
			return false;
		}
	}
	// If we made it this far, objects
	// are considered equivalent
	return true;
}


function degToRadians(deg) {
	return deg * (Math.PI / 180.0)
}


function radiansToDeg(rad) {
	return rad * (180.0 / Math.PI)
}



function median(arr) {
	console.log(arr)
	let nums = arr.sort(function(a, b){return a - b;}); // make a deep copy and sort it
	return nums[Math.floor(arr.length / 2)]; // for one item, i = 0; two items, i = 1; 3 items, i = 1...
}


// Intersection test

function onSegment(p, q, r) {
	// tests if q lies on segment between p and r
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
	var result = DOES_NOT_INTERSECT
	if (o1 != o2 && o3 != o4) result = DOES_INTERSECT

	// Special Cases

	// p1, q1 and p2 are colinear and p2 lies on segment p1q1
	p2_on_line = (o1 == 0 && onSegment(p1, p2, q1))
	// p1, q1 and q2 are colinear and q2 lies on segment p1q1
	q2_on_line = (o2 == 0 && onSegment(p1, q2, q1))
	// p2, q2 and p1 are colinear and p1 lies on segment p2q2
	p1_on_line = (o3 == 0 && onSegment(p2, p1, q2))
	// p2, q2 and q1 are colinear and q1 lies on segment p2q2
	q1_on_line = (o4 == 0 && onSegment(p2, q1, q2))
	if (p2_on_line || q2_on_line || p1_on_line || q1_on_line) result = DOES_INTERSECT

	if ((o1==0 && o2==0) && (p2_on_line || q2_on_line)) result = COLLINEAR // Not working FIXME
	if ((o3==0 && o4==0) && (p1_on_line || q1_on_line)) result = COLLINEAR // Not working FIXME

	// return DOES_NOT_INTERSECT // Doesn't fall in any of the above cases
	return result
}




//// Shortest distance of point from line
//// https://stackoverflow.com/a/1501725/5712554
// function sqr(x) { return x * x }
// function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
// function distToSegmentSquared(v, w, p) {
// 	let l2 = dist2(v, w);
// 	if (l2 == 0) return dist2(p, v);
// 	let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
// 	t = Math.max(0, Math.min(1, t));
// 	return dist2(p, { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) });
// }
// function distToSegment(v, w, p) { return Math.sqrt(distToSegmentSquared(v, w, p)); }


