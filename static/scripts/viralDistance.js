
/** viralDistance */
(function () {
    let scr, spiller, last;
    let motstandere = {};
    let stepX, stepY;
    const socket = io();
    function setup() {
        scr = dcl.setupScreen(1000, 600);
        scr.setBgColor('black');
        document.body.style.backgroundColor = 'charcoal';
        spiller = byggSpiller(dcl.vector((scr.width / 4)/scr.width, (scr.width / 4)/scr.height), 50, socket.io, name);
        stepX = 1/scr.width;
        stepY = 1/scr.height;
        let color = [dcl.randomi(64, 255), dcl.randomi(64, 255), dcl.randomi(64, 255)];
        spiller.setColor(color);

        socket.on('message', function (data) {
            console.log(data);
        });
        socket.emit('new player', color);
        setInterval(function () {
            socket.emit('movement', { name: name, pos: spiller.getPos(), size: spiller.getSize() });
            if (Object.keys(motstandere).length >= 2) {
                spiller.grow();
            }
        }, 1000 / 60);
        socket.on('state', function (players) {
            let ids = Object.keys(players);
            motstandere = {};
            for (let i = 0; i < ids.length; i++) {
                motstandere[ids[i]] = byggSpiller(dcl.vector(players[ids[i]].x, players[ids[i]].y), players[ids[i]].size, ids[i], players[ids[i]].name);
                motstandere[ids[i]].setColor(players[ids[i]].color);
                if(ids[i]==socket.id){
                    spiller.setSize(players[ids[i]].size);
                }
            }

        });
        socket.on("kill", function (id) {
            delete motstandere[id];
        });
        socket.on("bang", function (id) {
            if (socket.id === id) {
                spiller.shrink();
            }
        })

        document.addEventListener("keydown", fangTaster);
    }

    function fangTaster(event) {
        if (event.keyCode === KEYS.LEFT || event.keyCode === KEYS.A) {
            spiller.retning(dcl.vector(-1, 0));
        } else if (event.keyCode === KEYS.RIGHT || event.keyCode === KEYS.D) {
            spiller.retning(dcl.vector(1, 0));
        } else if (event.keyCode === KEYS.UP || event.keyCode === KEYS.W) {
            spiller.retning(dcl.vector(0, -1));
        } else if (event.keyCode === KEYS.DOWN || event.keyCode === KEYS.S) {
            spiller.retning(dcl.vector(0, 1));
        }
    }

    function byggSpiller(pos, size, id, label) {
        let dir = dcl.vector(0, 0);
        let speed = 0.01;
        let color = dcl.color(dcl.randomi(128, 255), dcl.randomi(128, 255), dcl.randomi(128, 255));

        return {
            id: id,
            setColor: function (rgb) {
                color = dcl.color(rgb[0], rgb[1], rgb[2]);
            },
            getPos: function () {
                return pos;
            },
            getSize: function () {
                return size;
            },
            setSize: function(si){
                size = si;
            },
            setPos: function (p) {
                pos = p;
            },
            retning: function (v) {
                dir = v;
            },
            grow: function () {
                size += 0.1;
                if (size > 500) {
                    size = 500;
                }
            },
            shrink: function () {
                if (size < 10) {
                    window.location = "loose.html";
                }
                dir = dir.smul(-1);
                speed += 0.002;
                if(speed > 0.05){
                    speed = 0.05;
                }
            },
            update: function () {
                pos = dir.smul(speed).add(pos);
                if (pos.x < 0 - size/scr.width) {
                    pos.x = 1 + size/scr.width;
                }
                if (pos.x > 1 + size/scr.width) {
                    pos.x = 0 - size/scr.width;
                }
                if (pos.y < 0 - size/scr.height) {
                    pos.y = 1 + size/scr.height;
                }
                if (pos.y > 1 + size/scr.height) {
                    pos.y = 0 - size/scr.height;
                }
            },
            draw: function () {
                dcl.circle(pos.x*scr.width, pos.y*scr.height, size, color, 0);
                dcl.text(label, pos.x*scr.width, pos.y*scr.height);
            },
            collides: function (enemy) {
                let ep = enemy.getPos();
                let e = {
                    x: ep.x,
                    y: ep.y,
                    size: enemy.getSize()
                }
                let dx = e.x - pos.x;
                let dy = e.y - pos.y;
                let d = Math.sqrt(dx * dx + dy * dy);
                if (d > size/scr.width + e.size/scr.width) {
                    return false;
                }
                if (d < abs(size - e.size)) {
                    return true;
                }
                if (d === 0 && size === e.size) {
                    return true;
                }

                let a = (size/scr.width * size/scr.width - e.size/scr.width * e.size/scr.width + d * d) / (2 * d);
                let h = Math.sqrt(size/scr.width * size/scr.width - a * a);
                let xm = pos.x + a * dx / d;
                let ym = pos.y + a * dy / d;
                let xs1 = xm + h * dy / d;
                let xs2 = xm - h * dy / d;
                let ys1 = ym - h * dx / d;
                let ys2 = ym + h * dx / d;
                return (xs1 >= 0 && ys1 >= 0) || (xs2 >= 0 && ys2 >= 0);
            }
        }
    }
    let hit = false;
    function draw() {
        let keys = Object.keys(motstandere);

        keys.forEach(k => {
            motstandere[k].draw();
            if (socket.id === k) {
                return;
            }
            if (spiller.collides(motstandere[k]) && !hit) {
                // socket.emit("hit", { id: k, size: spiller.getSize() });
                socket.emit("hit", { id: socket.id, size: motstandere[k].getSize() });
                hit = true;
                setTimeout(() => {
                    hit = false;
                }, 500);
            }
        });
    }

    function update() {
        spiller.update();
    }
    function gameLoop(dt) {
        if (!last) {
            last = dt;
        }
        dcl.clear();
        draw();
        update();
        requestAnimationFrame(gameLoop)
    }
    let name = prompt("Skriv inn navn:");
    setup();
    gameLoop(0);
})();