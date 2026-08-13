const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speedDisplay');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const spritesheets = {
    tiles: {},
    vehicles: {},
    objects: {}
};
const images = {};

let assetsLoaded = 0;
const totalAssets = 6; // 3 XMLs, 3 PNGs

function checkLoadComplete() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        generateTrack();
        requestAnimationFrame(gameLoop);
    }
}

async function loadXML(url, type) {
    const response = await fetch(url);
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const subTextures = xmlDoc.getElementsByTagName('SubTexture');
    for (let i = 0; i < subTextures.length; i++) {
        const node = subTextures[i];
        spritesheets[type][node.getAttribute('name')] = {
            x: parseInt(node.getAttribute('x')),
            y: parseInt(node.getAttribute('y')),
            w: parseInt(node.getAttribute('width')),
            h: parseInt(node.getAttribute('height'))
        };
    }
    checkLoadComplete();
}

function loadImage(url, name) {
    const img = new Image();
    img.onload = () => {
        images[name] = img;
        checkLoadComplete();
    };
    img.src = url;
}

// Load assets
loadImage('Spritesheets/spritesheet_tiles.png', 'tiles');
loadImage('Spritesheets/spritesheet_vehicles.png', 'vehicles');
loadImage('Spritesheets/spritesheet_objects.png', 'objects');

loadXML('Spritesheets/spritesheet_tiles.xml', 'tiles');
loadXML('Spritesheets/spritesheet_vehicles.xml', 'vehicles');
loadXML('Spritesheets/spritesheet_objects.xml', 'objects');

// Game state
const car = {
    x: 400,
    y: 300,
    angle: 0,
    speed: 0,
    maxSpeed: 600,
    acceleration: 400,
    friction: 200,
    turnSpeed: 3,
    sprite: 'car_blue_1.png'
};

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

window.addEventListener('keydown', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
window.addEventListener('keyup', e => {
    if (keys.hasOwnProperty(e.key)) keys[e.key] = false;
});

const track = [];
const tileSize = 128;
const trackWidth = 20;
const trackHeight = 20;
const camera = { x: 0, y: 0 };

function generateTrack() {
    for (let y = 0; y < trackHeight; y++) {
        track[y] = [];
        for (let x = 0; x < trackWidth; x++) {
            if (x >= 4 && x <= 14) {
                track[y][x] = 'road_asphalt01.png';
            } else {
                track[y][x] = 'land_grass01.png';
            }
        }
    }
}

let lastTime = performance.now();

function update(dt) {
    if (keys.ArrowUp) {
        car.speed += car.acceleration * dt;
    } else if (keys.ArrowDown) {
        car.speed -= car.acceleration * dt;
    } else {
        if (car.speed > 0) {
            car.speed = Math.max(0, car.speed - car.friction * dt);
        } else if (car.speed < 0) {
            car.speed = Math.min(0, car.speed + car.friction * dt);
        }
    }

    if (car.speed > car.maxSpeed) car.speed = car.maxSpeed;
    if (car.speed < -car.maxSpeed / 2) car.speed = -car.maxSpeed / 2;

    if (car.speed !== 0) {
        const turnDir = car.speed > 0 ? 1 : -1;
        if (keys.ArrowLeft) car.angle -= car.turnSpeed * turnDir * dt;
        if (keys.ArrowRight) car.angle += car.turnSpeed * turnDir * dt;
    }

    car.x += Math.sin(car.angle) * car.speed * dt;
    car.y -= Math.cos(car.angle) * car.speed * dt;

    camera.x = car.x - canvas.width / 2;
    camera.y = car.y - canvas.height / 2;

    speedDisplay.textContent = Math.floor(Math.abs(car.speed));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw track
    for (let y = 0; y < trackHeight; y++) {
        for (let x = 0; x < trackWidth; x++) {
            const tileName = track[y][x];
            const tileData = spritesheets.tiles[tileName];
            if (tileData && images.tiles) {
                ctx.drawImage(
                    images.tiles,
                    tileData.x, tileData.y, tileData.w, tileData.h,
                    x * tileSize, y * tileSize, tileSize, tileSize
                );
            }
        }
    }

    // Draw car
    const carData = spritesheets.vehicles[car.sprite];
    if (carData && images.vehicles) {
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);
        ctx.drawImage(
            images.vehicles,
            carData.x, carData.y, carData.w, carData.h,
            -carData.w / 2, -carData.h / 2, carData.w, carData.h
        );
        ctx.restore();
    }

    ctx.restore();
}

function gameLoop(time) {
    const dt = (time - lastTime) / 1000;
    lastTime = time;

    // cap dt to prevent huge jumps if tab was inactive
    update(Math.min(dt, 0.1));
    draw();

    requestAnimationFrame(gameLoop);
}
