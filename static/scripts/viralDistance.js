
/** viralDistance */
(function () {
    let scr, spiller, last;
    let motstandere = [];

    function setup() {
        scr = dcl.setupScreen(window.innerWidth, window.innerHeight);
        scr.setBgColor('black');
        document.body.style.backgroundColor = 'black';
        spiller = byggSpiller(dcl.vector(scr.width / 4, scr.widht / 4), 50);
        const socket = io();
        socket.on('message', function (data) {
            console.log(data);
        });
        socket.emit('new player');
        setInterval(function () {
            socket.emit('movement', { pos: spiller.getPos(), size: spiller.getSize() });
            spiller.grow();
        }, 1000 / 60);
        socket.on('state', function (players) {
            let ids = Object.keys(players);
            for (let i = 0; i < ids.length; i++) {
                if(!motstandere[ids[i]]){
                    motstandere[ids[i]] = byggSpiller(dcl.vector(players[ids[i]].x, players[ids[i]].y), players[ids[i]].size);                    
                } else {
                    motstandere[ids[i]].setPos(dcl.vector(players[ids[i]].x, players[ids[i]].y));
                }
                
            }
        });
        document.addEventListener("keydown", fangTaster);
    }

    function fangTaster(event) {
        console.log(event);
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

    function byggSpiller(pos, size) {
        let dir = dcl.vector(0, 0);
        let speed = 4;
        let color = dcl.color(dcl.randomi(128, 255), dcl.randomi(128, 255), dcl.randomi(128, 255));

        return {
            getPos: function () {
                return pos;
            },
            getSize: function () {
                return size;
            },
            setPos: function (p) {
                pos = p;
            },
            retning: function (v) {
                dir = v;
            },
            grow: function(){
                size += 0.01;
                if(size > 500){
                    size = 500;
                }
            },
            update: function () {
                pos = dir.smul(speed).add(pos);
                if(pos.x < 0-size){
                    pos.x = scr.width + size;
                }
                if(pos.x > scr.width + size){
                    pos.x = 0 - size;
                }
                if(pos.y < 0 - size){
                    pos.y = scr.height  + size;
                }
                if(pos.y > scr.height + size){
                    pos.y = 0 - size;
                }
            },
            draw: function () {
                dcl.circle(pos.x, pos.y, size, color, 0);
            }
        }
    }

    function draw() {
        spiller.draw();
        motstandere.forEach(m => {
            m.draw();
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
    setup();
    gameLoop(0);
})();