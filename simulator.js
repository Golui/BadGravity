const DATA = {
    "bodies": [{
        "m": 10000.0,
        "r": 20.0,
        "x": 0.0,
        "y": 0.0,
        "vx": 0.0,
        "vy": 0.0,
        "fix": true
    }, {
        "m": 20.0,
        "r": 5.0,
        "x": 120.0,
        "y": 0.0,
        "vx": 0.0,
        "vy": -10.0,
    }, {
        "m": 20.0,
        "r": 5.0,
        "x": 100.0,
        "y": 0.0,
        "vx": 5.0,
        "vy": 10.0,
    }, {
        "m": 2.0,
        "r": 3.0,
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

function hexString2Int(str) {
    return parseInt(str.slice(1), 16);
}

function generateCircleSprite(radius, withColor) {
    var circle = new PIXI.Graphics();
    if (!withColor) circle.beginFill(hexString2Int(randomColor()));
    else circle.beginFill(hexString2Int(withColor));
    circle.drawCircle(0, 0, radius);
    circle.endFill();
    return new PIXI.Sprite(circle.generateCanvasTexture(1.0, 1.0));
}

class Simulation {

    constructor(rawBodies) {
        this.bodies = [];
        this.dt = 0.0001;
        this.saveEach = 10000;
        this.gee = 1.0;

        this.trajectory = [];
        this.sprites = [];

        this.generating = false;

        this.currentDisplayedFrame = 0;

        this.simulationWorker = new Worker('simulation_worker.js');

        this.simulationWorker.addEventListener("message", (message) => {
                console.log(message.data);
                if (message.data.result == "complete") {
                    this.generating = false;
                    this.trajectory = this.trajectory.concat(message.data
                        .trajectory);
                    //alert("Simulation complete");
                } else if (message.data.result == "frameTick") {
                    document.getElementsByClassName("progressBar")[0].style
                        .width =
                        message.data.percent;

                }
            },
            false);

        var baryX, baryY, totalMass;
        baryX = baryY = totalMass = 0;


        rawBodies.forEach((rawBody) => {
            var b = Body.fromJson(rawBody);
            if (b.m == 0.0) return;
            // b.x += app.screen.width / 2;
            // b.y += app.screen.height / 2;
            let sprite = generateCircleSprite(b.r, b.color);
            sprite.width = sprite.height = 2 * b.r;
            sprite.anchor.set(0.5);
            baryX += b.x * b.m;
            baryY += b.y * b.m;
            totalMass += b.m;
            // sprite.x = b.x;
            // sprite.y = b.y;
            this.bodies.push(b);
            this.sprites.push(sprite);
            console.log(`Body: x:${b.x} y:${b.y}`);
            app.stage.addChild(sprite);

        });

        baryX /= totalMass;
        baryY /= totalMass;

        baryX -= app.screen.width / 2;
        baryY -= app.screen.height / 2;

        this.bodies.forEach((body, idex) => {
            body.x -= baryX;
            body.y -= baryY;
            let sprite = this.sprites[idex];
            sprite.x = body.x;
            sprite.y = body.y;
        });
        this.trajectory.push(JSON.parse(JSON.stringify(this.bodies)));
        document.getElementById("currentFrameCounter").value = (this.currentDisplayedFrame);

    }

    setFrame(frameNumber) {
        if (this.trajectory.length <= frameNumber) {
            this.dispatchGenerate(frameNumber);
        } else {
            let theFrame = this.trajectory[frameNumber];
            theFrame.forEach((body, idex) => {
                let sprite = this.sprites[idex];
                sprite.x = body.x;
                sprite.y = body.y;
            });
            this.currentDisplayedFrame = frameNumber;
        }
    }

    simulateFrames(frames) {
        this.simulationWorker.postMessage({

            mode: "precompute",
            dt: this.dt,
            saveEach: this.saveEach,
            frameCount: frames,
            bodies: this.trajectory[this.trajectory.length - 1],
            gee: this.gee

        });
    }

    dispatchGenerate(upTo) {
        this.generating = true;
        app.simulation.simulateFrames(upTo - app.simulation.trajectory.length);
    }
}

// The application will create a canvas element for you that you
// can then insert into the DOM
document.getElementById("bigWrapper").getElementsByClassName("canvasWrapper")[0]
    .appendChild(
        app.view);

let cfg = DATA;
newSimFromJson(JSON.stringify(cfg));
app.isPlaying = false;

// app.ticker.add(() => {
//     app.simulation.tickSimulation();
// });

function onCanvasClick() {
    app.simulation.tickSimulation();
}

function tickApp() {
    if (app.isPlaying) {
        app.simulation.setFrame((parseInt(app.simulation.currentDisplayedFrame) +
                1) %
            app.simulation.trajectory
            .length);
        document.getElementById("currentFrameCounter").value = (app.simulation.currentDisplayedFrame);
    }
}

app.ticker.add(tickApp);

function playAnimation() {
    if (app.isPlaying) {
        app.isPlaying = false;
    } else {
        app.isPlaying = true;
    }


}

function precomputeFrames() {
    let valueInput = document.getElementById(
        "totalFrames");
    app.simulation.dispatchGenerate(parseInt(valueInput.value));
}

document.getElementById("currentFrameCounter").addEventListener('input', (e) => {
    var value = parseInt(e.target.value);
    if (value > app.simulation.trajectory.length - 1) {
        value = app.simulation.trajectory.length - 1;
    } else if (value < 0) {
        value = 0;
    }
    e.target.value = value;

    app.simulation.setFrame(value);
});

function downloadTrajectory() {
    download(JSON.stringify(obj, (
            k,
            v) => {
            if (["sprites", "simulationWorker",
                    "currentDisplayedFrame", "generating"
                ].includes(k)) return undefined;
            else return v;
        }, 2), "Simulation.json",
        "text/json");
}

function newSimFromJson(rawJson) {
    var theFile = JSON.parse(rawJson);
    if (theFile) {
        for (let i = app.stage.children.length - 1; i >= 0; i--) {
            app.stage.removeChild(app.stage.children[i]);
        }
        let bodies = theFile.bodies ? theFile.bodies : theFile.trajectory[
            0];
        let sim = new Simulation(bodies);
        Object.assign(sim, theFile);
        console.log(sim);
        app.simulation = sim;
        sim.setFrame(0);
    } else {
        alert("Malformed Json");
    }

    document.getElementById("simJson").value = JSON.stringify(app.simulation, (
        k,
        v) => {
        if (["sprites", "trajectory", "simulationWorker",
                "currentDisplayedFrame", "generating"
            ].includes(k)) return undefined;
        else return v;
    }, 2);

}

function upload() {

    let files = document.getElementById("fileUp").files;
    if (files && files.length > 0) {
        let reader = new FileReader();
        reader.onload = (evt) => {
            console.log(evt);
            newSimFromJson(evt.target.result);
        };
        reader.readAsText(files[0]);

    } else {
        alert("Select a simulation file");
    }
}

function setFromText() {
    newSimFromJson(document.getElementById("simJson").value);
}
