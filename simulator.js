const DATA = {
    "bodies": [{
        "m": 200.0,
        "r": 2.0,
        "x": 420.0,
        "y": 300.0,
        "vx": 0.0,
        "vy": 0.0,
    }, {
        "m": 200.0,
        "r": 3.0,
        "x": 380.0,
        "y": 300.0,
        "vx": 0.0,
        "vy": 0.0,
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
const app = new PIXI.Application();

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
    circle.beginFill(0xFFFFFF);
    circle.drawCircle(0, 0, radius);
    circle.endFill();
    return new PIXI.Sprite(circle.generateCanvasTexture(1.0, 1.0));
}

class Simulation {
    constructor(bodies) {
        this.bodies = [];
        this.dt = 0.1;
        this.saveInterval = 1.0;

        bodies.forEach((rawBody) => {
            var b = Body.fromJson(rawBody);
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
        });
    }

    tickSimulation() {


        // Increment positions due to velocities
        this.bodies.forEach((bodyObj) => {
            var b = bodyObj.body;
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
            var ax = 0.0,
                ay = 0.0;

            this.bodies.forEach((bodyObj2) => {
                var j = bodyObj2.body;
                if (i == j) return;
                let dx = i.x - j.x;
                let dy = i.y - i.y;
                let dx3 = Math.abs(dx * dx * dx);
                let dy3 = Math.abs(dy * dy * dy);
                ax += j.m * dx / dx3;
                ay += j.m * dy / dy3;
                let radsum = i.r + j.r;
                if (dx * dx + dy * dy <= radsum * radsum) {
                    ax *= -1;
                    ay *= -1;
                }
            });
            ax *= -GEE;
            ay *= -GEE;
            //console.log(`${ax} ${ay}`);
            i.vx += ax * this.dt;
            i.vy += ay * this.dt;
        });


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
