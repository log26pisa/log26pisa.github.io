const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let particlesArray;
let cardElements = document.querySelectorAll('.card');
let obstacles = [];

// resizing
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // ensure elements are re-selected if DOM changes (though here it's static)
    cardElements = document.querySelectorAll('.card');
}
window.addEventListener('resize', () => {
    resizeCanvas();
    init();
});
resizeCanvas();

// mouse interaction
let mouse = {
    x: null,
    y: null,
    prevX: null,
    prevY: null,
    radius: (canvas.height / 100 + canvas.width / 100) * 8, // Linear scaling roughly matching previous visual on 1080p
    changed: false
};

window.addEventListener('mousemove', (event) => {
    // store previous coords
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    // update current coords
    mouse.x = event.x;
    mouse.y = event.y;

    // mark change if coords differ from previous
    mouse.changed = (mouse.prevX !== mouse.x) || (mouse.prevY !== mouse.y);
});

window.addEventListener('mouseout', () => {
    mouse.prevX = undefined;
    mouse.prevY = undefined;
    mouse.x = undefined;
    mouse.y = undefined;
    mouse.changed = false;
});

// Particle class
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }

    // Method to draw individual particle
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = '#58a6ff'; 
        ctx.fill();
    }

    // Check particle position, check mouse position, move the particle, draw the particle
    update() {
        // move particle
        this.x += this.directionX;
        this.y += this.directionY;

        // checks if particle is still within canvas, bouncing logic
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        // check collision detection - mouse position / particle position
        if (mouse.x !== null) {
            let dx = this.x - mouse.x;
            let dy = this.y - mouse.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // tolerance to make movement feel more natural
            const tolerance = 50; // pixels of soft range around mouse radius
            const effectiveRadius = mouse.radius + this.size + tolerance;

            if (distance < effectiveRadius && distance > 0) {
                // push strength proportional to proximity (0..1)
                let push = 1 - (distance / effectiveRadius);
                // soften and randomize the push a bit for natural look
                const maxForce = 3; // max displacement per frame
                const jitter = (Math.random() - 0.5) * 0.8;
                const force = push * maxForce + jitter;

                // normalize direction from mouse to particle and apply force away from mouse
                this.x += (dx / distance) * force;
                this.y += (dy / distance) * force;

                // optional small damping so particles don't teleport too far
                // keep particles away from immediate screen edges
                if (this.x > canvas.width - this.size) this.x = canvas.width - this.size;
                if (this.x < this.size) this.x = this.size;
                if (this.y > canvas.height - this.size) this.y = canvas.height - this.size;
                if (this.y < this.size) this.y = this.size;
            }
        }
        // draw particle
        this.draw();
    }
}

// create particle array
function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 0.4) - 0.2;
        let directionY = (Math.random() * 0.4) - 0.2;
        let color = '#58a6ff';

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

// check if particles are close enough to draw line between them
function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 5) * (canvas.height / 5)) {
                opacityValue = 1 - (distance / 20000);
                if(opacityValue < 0) opacityValue = 0;
                ctx.strokeStyle = 'rgba(88, 166, 255,' + opacityValue + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

// animation loop
function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

// kick off
init();
animate();
