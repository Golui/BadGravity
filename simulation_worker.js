self.addEventListener("message", messageHandler);

function messageHandler(message) {
    if (message.data.mode == "precompute") {
        tickFrames(message);
    }
}

function tickFrames(message) {

    console.log(message.data);
    let dt = message.data.dt;
    let saveEach = message.data.saveEach;
    let bodies = message.data.bodies;
    let gee = message.data.gee;
    let frameCount = message.data.frameCount;

    let trajectory = [];

    for (let frame = 0; frame < frameCount; frame++) {

        bodies = tickFrame(saveEach, dt, gee, bodies);

        self.postMessage({
            result: "frameTick",
            frameNumber: frame,
            percent: `${Math.round(100* (frame + 1)/frameCount)}%`
        });
        trajectory.push(JSON.parse(JSON.stringify(bodies)));
    }
    self.postMessage({
        result: "complete",
        trajectory: trajectory
    });
}

function tickFrame(saveEach, dt, gee, bodies) {
    for (let step = 0; step < saveEach; step++) {
        // Increment positions due to velocities
        bodies.forEach((b) => {
            if (b.fix) return;
            b.x = b.x + b.vx * dt;
            b.y = b.y + b.vy * dt;

            // s.x = b.x;
            // s.y = b.y;

            //console.log(`${b.vx} ${b.vy}`);
        });

        //Compute accelerations. Indices are i and j to be consistent with notes


        bodies.forEach((i) => {
            if (i.fix) return;
            var ax = 0.0,
                ay = 0.0;

            bodies.forEach((j) => {
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
            ax *= -gee;
            ay *= -gee;
            //console.log(`${ax} ${ay}`);
            if (ax) i.vx += ax * dt;
            if (ay) i.vy += ay * dt;
        });
    }

    return bodies;
}
