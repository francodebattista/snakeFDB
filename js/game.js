/*jslint bitwise:true, es5: true */
(function (window, undefined) {
    'use strict';
    var KEY_ENTER = 13,
        KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40,
        
        canvas = null,
        ctx = null,
        buffer = null,
        bufferCtx = null,
        bufferScale = 1,
        bufferOffsetX = 0,
        bufferOffsetY = 0,
        lastPress = null,
        pause = true,
        gameover = true,
        fullscreen = false,
        body = [],
        food = null,
        fruit = null,
        //wall = [],
        dir = 0,
        score = 0,
        iBody = new Image(),
        iFood = new Image(),
        iFruit = new Image(),
        aEat = new Audio(),
        aDie = new Audio(),

        lastUpdate = 0,
        FPS = 0,
        frames = 0,
        acumDelta = 0,
        interval = 50,
        CPS = 0,
        cicles = 0,
        x = 50, 

        currentScene = 0,
        scenes = [],
        mainScene = null,
        gameScene = null,
        
        highscores = [],
        posHighscore = 10,
        highscoresScene = null;


    window.requestAnimationFrame = (function(){
        return window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function (callback) {
                window.setTimeout (callback,17)
            };
    }());

    

    document.addEventListener('keydown', function (evt) {
        if (evt.which >= 37 && evt.which <= 40) {
            evt.preventDefault();
        }

        lastPress = evt.which;
    }, false);


    function Rectangle(x, y, width, height) {
        this.x = (x == null) ? 0 : x;
        this.y = (y == null) ? 0 : y;
        this.width = (width == null) ? 0 : width;
        this.height = (height == null) ? this.width : height;

        this.intersects = function (rect) {
            if (rect == null) {
                window.console.warn('Missing parameters on function intersects');
            } else {
                return (
                    this.x < rect.x + rect.width &&
                    this.x + this.width > rect.x &&
                    this.y < rect.y + rect.height &&
                    this.y + this.height > rect.y
                );
            }
        };

        this.fill = function (ctx) {
            if (ctx == null) {
                window.console.warn('Missing parameters on function fill');
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        };
    }

    Rectangle.prototype = {
        constructor: Rectangle,

        intersects: function (rect) {
            if (rect == undefined) {
                window.console.warn('Missing parameters on function intersects');
            } else {
                return (this.x < rect.x + rect.width &&
                    this.x + this.width > rect.x &&
                    this.y < rect.y + rect.height &&
                    this.y + this.height > rect.y
                )
            }
        },

        fill: function (ctx) {
            if (ctx === undefined) {
                window.console.warn('Missing parameters on function fill');
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        },

        drawImage: function (ctx, img) {
            if (img === undefined) {
                window.console.warn('Missing parameters on function drawImage');
            } else {
                if (img.width) {
                    ctx.drawImage(img, this.x, this.y);
                } else {
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                }
            }
        }


    }
    /*
    function random(max) {
        return Math.floor(Math.random() * max);
    }
    */

   function Scene() {
    this.id = scenes.length;
    scenes.push(this);
    }
    Scene.prototype = {
        constructor: Scene,
        load: function () {},
        paint: function (ctx) {},
        act: function () {}
    };

    function loadScene(scene) {
        currentScene = scene.id;
        scenes[currentScene].load();
    }

    function random(max) {
        return ~~(Math.random() * max);
    }

    function addHighscore(score) {
        posHighscore = 0;
        while (highscores[posHighscore] > score && posHighscore < highscores.length) {
            posHighscore += 1;
        }
        highscores.splice(posHighscore, 0, score);
        if (highscores.length > 10) {
            highscores.length = 10;
        }
        localStorage.highscores = highscores.join(',');
    }


    function canPlayOgg() {
        var aud = new Audio();
        if (aud.canPlayType('audio/ogg').replace(/no/, '')) {
            return true;
        } else {
            return false;
        }
    }

    function resize () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        var w = window.innerWidth / buffer.width;
        var h = window.innerHeight / buffer.height;
        bufferScale = Math.min(h, w);

        //canvas.style.width = (canvas.width * scale) + 'px';
        //canvas.style.height = (canvas.height * scale) + 'px';
        bufferOffsetX = (canvas.width - (buffer.width * bufferScale)) / 2;
        bufferOffsetY = (canvas.height - (buffer.height * bufferScale)) / 2;
    }

    function repaint() {
        window.requestAnimationFrame(repaint);
        if (scenes.length) {
            scenes[currentScene].paint(bufferCtx);
        }
        //paint(bufferCtx);
        frames++;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        //ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
        
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(buffer, bufferOffsetX, bufferOffsetY, buffer.width * bufferScale, buffer.height * bufferScale)
    }

    function run() {
        setTimeout(run, interval);
        if (scenes.length) {
            scenes[currentScene].act();
        }
        var now = Date.now();
        var deltaTime = (now - lastUpdate) / 1000;
        if (deltaTime > 1) {
            deltaTime = 0;
        }
        lastUpdate = now;

        cicles += 1;
        acumDelta += deltaTime;
        if (acumDelta > 1) {
            FPS = frames;
            CPS = cicles;
            frames = 0;
            cicles = 0;
            acumDelta -= 1;
        }
    }

    function init() {
        // Get canvas and context
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
        //canvas.width = 600;
        //canvas.height = 300;
        
        // Load buffer
        buffer = document.createElement('canvas');
        bufferCtx = buffer.getContext('2d');
        buffer.width = 300;
        buffer.height = 150;

        // Load assets
        iBody.src = 'snakeOk.png';
        iFood.src = 'fruit.png';
        iFruit.src = 'lemon.jpeg';


        if (canPlayOgg()) {
            aEat.src = 'chomp.oga';
            aDie.src = 'dies.oga';
        } else {
            Eat.src = 'chomp.oga';
            aDie.src = 'dies.oga';
        }
        // Create food
        food = new Rectangle(80, 80, 10, 10);

        // Create fruit
        setTimeout(function newFruit(){
            fruit.x = random(canvas.width / 10 - 1) * 10;
            fruit.y = random(canvas.height / 10 - 1) * 10;
        }, 5000);
        fruit = new Rectangle(80, 80, 10, 10);

        
        // Create walls
        //wall.push(new Rectangle(100, 50, 10, 10));
        //wall.push(new Rectangle(100, 100, 10, 10));
        //wall.push(new Rectangle(200, 50, 10, 10));
        //wall.push(new Rectangle(200, 100, 10, 10));

        // Load saved highscores
        if (localStorage.highscores) {
            highscores = localStorage.highscores.split(',');
        }

        // Start game
        run();
        repaint();
    }


    // Main Scene
    mainScene = new Scene();

    mainScene.paint = function (ctx) {
        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE', 150, 60);
        ctx.fillText('Press Enter', 150, 90);
    };

    mainScene.act = function () {
    
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(highscoresScene);
            lastPress = null;
        }
    };
    
    // Game Scene
    gameScene = new Scene()

    gameScene.load = function () {
        score = 0;
        dir = 1;
        body.length = 0;
        body.push(new Rectangle(40, 40, 10, 10));
        body.push(new Rectangle(0, 0, 10, 10));
        body.push(new Rectangle(0, 0, 10, 10));
        food.x = random(buffer.width / 10 - 1) * 10;
        food.y = random(buffer.height / 10 - 1) * 10;
        fruit.x = random(buffer.width / 10 - 1) * 10;
        fruit.y = random(buffer.height / 10 - 1) * 10;    
        gameover = false;
    }

    gameScene.paint = function (ctx) {
        var i = 0;
        var l = 0;

        // Clean canvas - buffer
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, buffer.width, buffer.height);
        
        // Draw player
        //ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#0f0';
        for (i = 0, l = body.length; i < l; i += 1) {
            //body[i].fill(ctx);
            body[i].drawImage(ctx, iBody);
        }
        
        // Draw walls
        //ctx.fillStyle = '#999';
        //for (i = 0, l = wall.length; i < l; i += 1) {
        //    wall[i].fill(ctx);
        //}

        // Draw food
        ctx.strokeStyle = '#f00';
        food.drawImage(ctx, iFood);

        // Draw fruit
        
        ctx.strokeStyle = '#f00';
        fruit.drawImage(ctx, iFruit);
        
        // Debug last key pressed
        //ctx.fillStyle = '#fff';
        //ctx.fillText('Last Press: ' + lastPress, 0, 20);
        
        // Draw score
        ctx.fillStyle = '#fff';
        ctx.fillText('Score: ' + score, 0, 10);
        
        // Draw FPS
        ctx.fillText('FPS: ' + FPS, 50, 10);
        ctx.fillText('CPS: ' + CPS, 50, 20);

        // Draw pause
        if (pause) {
            ctx.textAlign = 'center';
            if (gameover) {
                ctx.fillText('GAME OVER', 150, 75);
            } else {
                ctx.fillText('PAUSE', 150, 75);
            }
            ctx.textAlign = 'left';
        }

    }

    gameScene.act = function () {
        var i;
        var l;
        if (!pause) {
            // GameOver Reset
            if (gameover) {
                loadScene(highscoresScene);
            }

            x += 6;
            if (x > canvas.width) {
                x = 0;
            }

            // Move Body
            for (i = body.length - 1; i > 0; i -= 1) {
                body[i].x = body[i - 1].x;
                body[i].y = body[i - 1].y;    
            }
            
            // Change Direction
            if (lastPress === KEY_UP && dir !== 2) {
                dir = 0;
            }
            if (lastPress === KEY_RIGHT && dir !== 3) {
                dir = 1;
            }
                
            if (lastPress === KEY_DOWN && dir !== 0) {
                dir = 2;
            }

            if (lastPress === KEY_LEFT && dir !== 1) {
                dir = 3;    
            }

            // Move Head
            if (dir === 0) {
                body[0].y -= 10;
            }
            if (dir === 1) {
                body[0].x += 10;
            }
            if (dir === 2) {
                body[0].y += 10;
            }
            if (dir === 3) {
                body[0].x -= 10;
            }

            // Out Screen
            if (body[0].x > canvas.width - body[0].width) {
                body[0].x = 0;
            }
            if (body[0].y > canvas.height - body[0].height) {
                body[0].y = 0;
            }
            if (body[0].x < 0) {
            body[0].x = canvas.width - body[0].width;
            }
            if (body[0].y < 0) {
                body[0].y = canvas.height - body[0].height;
            }
            
            // Food Intersects
            if (body[0].intersects(food)) {
                body.push(new Rectangle(0,0,10, 10));
                score += 1;
                food.x = random(buffer.width / 10 - 1) * 10;
                food.y = random(buffer.height / 10 - 1) * 10;
                aEat.play()
            }

            // Fruit Intersects
            if (body[0].intersects(fruit)) {
                aEat.play()
                score += 10;
                fruit.x = -100
                fruit.y = -100
                setTimeout(function newFruit(){
                    fruit.x = random(canvas.width / 10 - 1) * 10;
                    fruit.y = random(canvas.height / 10 - 1) * 10;
                }, 10000);

                fetch('https://jsonplaceholder.typicode.com/posts/?score=${score}',{
                    method:'POST',
                    body:score
                    })
                    .then(function (response){
                        if(response.ok){
                            console.log('Succesfully score sent',response);
                        }
                    })
                    .catch(function (error) {
                        return console.log('Error trying to send the score');
                    })
                
            }
            

            // Wall Intersects
            //for (i = 0, l = wall.length; i < l; i += 1) {
            //    if (food.intersects(wall[i])) {
            //        food.x = random(canvas.width / 10 - 1) * 10;
            //        food.y = random(canvas.height / 10 - 1) * 10;
            //    }
            //    if (fruit.intersects(wall[i])) {
            //        fruit.x = random(canvas.width / 10 - 1) * 10;
            //        fruit.y = random(canvas.height / 10 - 1) * 10;
            //    }
            //    if (body[0].intersects(wall[i])) {
            //        gameover = true;
            //        pause = true;
            //   }
            //}

            // Body Intersects
            for (i = 2, l = body.length; i < l; i += 1) {
                if (body[0].intersects(body[i])) {
                    gameover = true;
                    pause = true;
                    aDie.play();
                    addHighscore(score);
                }
            }
        }    
        // Pause/Unpause
        if (lastPress === KEY_ENTER) {
            pause = !pause;
            lastPress = null;
        }
    }

    // Highscore Scene
    highscoresScene = new Scene();

    highscoresScene.paint = function (ctx) {
        var i = 0,
            l = 0;

        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', 150, 30);

        // Draw high scores
        ctx.textAlign = 'right';
        for (i = 0, l = highscores.length; i < l; i += 1) {
            if (i === posHighscore) {
                ctx.fillText('*' + highscores[i], 180, 40 + i * 10);
            } else {
                ctx.fillText(highscores[i], 180, 40 + i * 10);
            }
        }
    };

    highscoresScene.act = function () {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(gameScene);
            lastPress = null;
        }
    };
    window.addEventListener('load', init, false);
    window.addEventListener('resize', resize, false);
}(window));