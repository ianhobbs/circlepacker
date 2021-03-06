import CirclePacker from '../dist/circlepacker.js';
import { random } from '../src/util.js';

const DRAG_THRESOLD = 10;

const containerEl = document.querySelector( '.container' );
const addButtonEl = document.querySelector( '#add-circle' );
const deleteButtonEl = document.querySelector( '#delete-circle' );
const randomButtonEl = document.querySelector( '#random-size' );

// references to all circle elements
const circleEls = { };

// dimenstions of container
const rect = containerEl.getBoundingClientRect();
let bounds = { width: rect.width, height: rect.height };
const target = { x: bounds.width / 2, y: bounds.height / 2 };

var isDragging = false;

let circles = [
	createCircle(),
	createCircle(),
	createCircle(),
	createCircle(),
	createCircle()
];

const packer = new CirclePacker( { bounds, target, circles, onMove: render, collisionPasses: 3, centeringPasses: 2 } );

addButtonEl.addEventListener( 'click', addRandomCircle );
deleteButtonEl.addEventListener( 'click', removeRandomCircle );
randomButtonEl.addEventListener( 'click', setRandomBounds );

function addRandomCircle () {
	packer.addCircle( createCircle() );
}

// create circle dom object, return circle data
function createCircle ( x, y, radius ) {
	radius = radius || random( 10, 40 );
	x = x || random( radius, bounds.width - radius );
	y = y || random( radius, bounds.height - radius );

	const diameter = radius * 2;
	const circleEl = document.createElement( 'div' );
	
	// need some sort of unique id...
	const id = 'circle-' + random( 0, 1000, true ) + '-' + Date.now();

	const circle =  {
		id: id,
		radius: radius,
		position: {
			x: random( radius, bounds.width - radius ),
			y: random( radius, bounds.height - radius )
		}
	};

	// create circle el
	
	circleEl.id = id;
	circleEl.style.width = diameter + 'px';
	circleEl.style.height = diameter + 'px';
	circleEl.style.borderRadius = diameter + 'px';
	circleEl.classList.add( 'circle' );

	// store position for dragging
	circleEl.setAttribute( 'data-x', x );
	circleEl.setAttribute( 'data-y', y );
	circleEl.setAttribute( 'data-radius', radius );

	// start dragging
	circleEl.addEventListener( 'mousedown', function ( event ) {
		circlePressed( circleEl, circle, event );
	} );
	
	containerEl.appendChild( circleEl );

	circleEls[id] = circleEl;

	return circle;
}

function removeRandomCircle () {
	const ids = Object.keys( circleEls );
	const idToDelete = ids[random( 0, ids.length, true )];

	removeCircle( idToDelete );
}

function setRandomBounds () {
	bounds = {
		width: random( 200, 500, true ),
		height: random( 200, 500, true )
	};

	containerEl.style.width = bounds.width + 'px';
	containerEl.style.height = bounds.height + 'px';

	packer.setBounds( bounds );
}

function removeCircle ( id ) {
	packer.removeCircle( id );
	
	requestAnimationFrame( function () {
		containerEl.removeChild( circleEls[id] );
		delete circleEls[id];
	} );
}

function render ( circles ) {
	requestAnimationFrame( function () {
		for ( let id in circles ) {
			const circleEl = circleEls[id];

			if ( circleEl ) {
				const circle = circles[id];
				const x = circle.position.x - circle.radius;
				const y = circle.position.y - circle.radius;

				// store position for dragging
				circleEl.setAttribute( 'data-x', x );
				circleEl.setAttribute( 'data-y', y );

				// actually move the circles around
				circleEl.style.transform = `translateX(${ x }px) translateY(${ y }px)`;
				circleEl.classList.add( 'is-visible' );
			}
		}
	} );
}

// start and stop dragging
function circlePressed ( circleEl, circle, event ) {
	const circleStartPos = {
		x: parseFloat( circleEl.getAttribute( 'data-x' ) ) + circle.radius,
		y: parseFloat( circleEl.getAttribute( 'data-y' ) ) + circle.radius
	};

	const eventStartPos = { x: event.clientX, y: event.clientY };
	
	function dragStart () {
		document.addEventListener( 'mousemove', dragged );
		document.addEventListener( 'mouseup', dragEnd );
	}

	function dragged ( event ) {
		const currentPos = { x: event.clientX, y: event.clientY };

		const delta = {
			x: currentPos.x - eventStartPos.x,
			y: currentPos.y - eventStartPos.y
		};

		// start dragging if mouse moved DRAG_THRESOLD px
		if ( ! isDragging &&
			( Math.abs( delta.x ) > DRAG_THRESOLD || Math.abs( delta.y ) > DRAG_THRESOLD )
		) {
			isDragging = true;
			packer.dragStart( circle.id );
		}

		const newPos = { x: circleStartPos.x + delta.x, y: circleStartPos.y + delta.y };

		if ( isDragging ) {
			// end dragging if circle is outside the bounds
			if (
				newPos.x < circle.radius || newPos.x > bounds.width - circle.radius ||
				newPos.y < circle.radius || newPos.y > bounds.height - circle.radius
			) {
				dragEnd();
			} else {
				packer.drag( circle.id, newPos );
			}
		}
	}

	function dragEnd () {
		isDragging = false;
		document.removeEventListener( 'mousemove', dragged );
		packer.dragEnd( circle.id );
	}

	if ( ! isDragging ) {
		dragStart();
	}
}