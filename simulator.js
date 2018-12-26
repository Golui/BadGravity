const DATA = {
    "bodies": [{
        "m": 10000.0,
        "r": 20.0,
        "x": 0.0,
        "y": 0.0,
        "vx": 0.0,
        "vy": 0.0,
    }, {
        "m": 2.0,
        "r": 5.0,
        "x": 100.0,
        "y": 0.0,
        "vx": 0.0,
        "vy": 10.0,
    }, {
        "m": 2.0,
        "r": 5.0,
        "x": 100.0,
        "y": 0.0,
        "vx": 5.0,
        "vy": 10.0,
    }, {
        "m": 2.0,
        "r": 5.0,
        "x": 50.0,
        "y": 50.0,
        "vx": -5.0,
        "vy": -10.0,
    }]
};

// const DATA = {
//     "bodies": [{
//         "m": 2.0,
//         "r": 20.0,
//         "x": 100.0,
//         "y": 100.0,
//         "vx": 0.0,
//         "vy": 0.0,
//     }]
// };

const GEE = 1.0;

// The application will create a renderer using WebGL, if possible,
// with a fallback to a canvas render. It will also setup the ticker
// and the root stage PIXI.Container
const app = new PIXI.Application(1280, 800);

class Body {
    constructor(mass, radius) {
        this.m = mass;
        this.r = radius;
        this.x = this.y = this.vx = this.vy = 0.0;
    }

    static fromJson(obj) {
        if (obj) {
            var b = new Body();
            Object.assign(b, obj);
            return b;
        }
        return null;

    }
}

function generateCircle(radius) {
    var circle = new PIXI.Graphics();
    circle.beginFill(parseInt(randomColor().slice(1), 16));
    circle.drawCircle(0, 0, radius);
    circle.endFill();
    return new PIXI.Sprite(circle.generateCanvasTexture(1.0, 1.0));
}

class Simulation {
    constructor(rawBodies) {
        this.bodies = [];
        this.dt = 0.0001;
        this.saveInterval = 1.0;

        var maxMass = 0.0;
        rawBodies.forEach((rawBody) => {
            var b = Body.fromJson(rawBody);
            b.x += app.screen.width / 2;
            b.y += app.screen.height / 2;
            let sprite = generateCircle(b.r);
            sprite.width = sprite.height = 2 * b.r;
            sprite.anchor.set(0.5);
            sprite.x = b.x;
            sprite.y = b.y;
            this.bodies.push({
                "body": b,
                "sprite": sprite
            });
            console.log(`Body: x:${b.x} y:${b.y}`);
            app.stage.addChild(sprite);
            if ((maxMass < b.m)) maxMass = b.m;

        });

        this.bodies.forEach((bodyDupe) => {
            bodyDupe.body.fix = bodyDupe.body.m == maxMass;
        });
    }

    tickSimulation() {

        for (var i = 0; i < this.saveInterval / this.dt; i++) {
            // Increment positions due to velocities
            this.bodies.forEach((bodyObj) => {
                var b = bodyObj.body;
                if (b.fix) return;
                var s = bodyObj.sprite;
                b.x = b.x + b.vx * this.dt;
                b.y = b.y + b.vy * this.dt;

                s.x = b.x;
                s.y = b.y;

                //console.log(`${b.vx} ${b.vy}`);
            });

            //Compute accelerations. Indices are i and j to be consistent with notes

            this.bodies.forEach((bodyObj) => {
                var i = bodyObj.body;
                if (i.fix) return;
                var ax = 0.0,
                    ay = 0.0;

                this.bodies.forEach((bodyObj2) => {
                    var j = bodyObj2.body;
                    if (i == j) return;
                    let dx = i.x - j.x;
                    let dy = i.y - j.y;
                    let dxy = Math.abs(dx * dx * dx) +
                        Math
                        .abs(dy * dy * dy);

                    let radsum = i.r + j.r;
                    if ((dx * dx + dy * dy) <=
                        radsum *
                        radsum) {
                        // let tan = Math.atan2(dx, dy)
                        // let dm = i.m - j.m;
                        // let am = (i.m + j.ml) * this.dt;
                        // ax += (dm * i.vx + 2 * j.m * j.vx) /
                        //     am;
                        // ay += (dm * i.vy + 2 * j.m * j.vy) /
                        //     am;
                    } else {
                        ax += j.m * dx / dxy;
                        ay += j.m * dy / dxy;
                    }
                });
                ax *= -GEE;
                ay *= -GEE;
                //console.log(`${ax} ${ay}`);
                if (ax) i.vx += ax * this.dt;
                if (ay) i.vy += ay * this.dt;
            });
        }



    }
}

console.log(JSON.stringify(new Body(2.0, 1.0)));

// The application will create a canvas element for you that you
// can then insert into the DOM
document.body.appendChild(app.view);

// load the texture we need
PIXI.loader.add('config', 'bodies.json').load((loader, resources) => {
    // This creates a texture from a 'bunny.png' image
    //let cfg = resources.config
    let cfg = DATA;
    app.simulation = new Simulation(cfg.bodies);

    console.log(app.simulation);

    // app.stage.interactive = true;
    // app.stage.on('click', function(e) {
    //     console.log("t");
    // });

    // // Setup the position of the bunny
    // bunny.x = app.renderer.width / 2;
    // bunny.y = app.renderer.height / 2;
    //
    // // Rotate around the center
    // bunny.anchor.x = 0.5;
    // bunny.anchor.y = 0.5;
    //
    // // Add the bunny to the scene we are building
    // app.stage.addChild(bunny);
    //
    // // Listen for frame updates
    app.ticker.add(() => {
        app.simulation.tickSimulation();
    });
});

function doStuff() {
    app.simulation.tickSimulation();
}
