var INSIGHTS_2016 = (function() {

    function titlecase(s) {
        return s.substr(0,1).toUpperCase() + s.substr(1);
    }

    function load_guide(name) {
        var img = new Image;
        img.src = `guide/${name}.png`;
        return img;
    }

    var guides = {};
    [1, 2, 3, 4].forEach(n => {
        var t = 'template-' + n;
        guides[t] = load_guide(t);
    });

    //guides['personality-summary'] = load_guide('personality-summary');
    //guides['personality-details'] = load_guide('personality-details');

    var TILE_ASPECT = 6/5;
    var TILE_H = 1000;
    var TILE_W = TILE_H * TILE_ASPECT

    var COLORS = {
        type_dark: '#033f68',
        type_light: '#ffffff',
        blue1: '#48f6fe',
        green1: '#5bffa3',
        lime1: '#d1ff49',
        yellow1: '#ffe20b',
        pink1: '#ff50a0',
        blue2: '#20d5df',
        green2: '#36d87f',
        lime2: '#ade221',
        yellow2: '#edc211',

        // personality
        darkblue1: '#144ba6',
        darkblue2: '#1956c6'
    };

    var GIF_COLORS = {
        blue2: COLORS.blue2,
        green2: COLORS.green2,
        lime2: COLORS.lime2,
        racket: COLORS.lime2,
        pink1: COLORS.pink1,
        yellow2: COLORS.yellow2,
        '01-ace-blue': COLORS.blue2,
        '01-ace-pink': COLORS.pink1,
        '03-rebound-green': COLORS.green2,
        '03-rebound-pink': COLORS.pink1,
        '08-unforcederrors-lime': COLORS.lime2,
        '08-unforcederrors-yellow': COLORS.yellow2
    };

    var PI = Math.PI;
    var TWO_PI = 2 * Math.PI;
    var HALF_PI = Math.PI / 2;
    var DEG_PER_RAD = 180/Math.PI;
    var RAD_PER_DEG = Math.PI/180;
    function lerp(a, b, x) { return (1 - x) * a + x * b }
    function smoothstep(x) { return 3 * x * x - 2 * x * x * x }
    function modulo(x, y) { return ((x % y) + y) % y }
    function clamp(x, a, b) { return x < a ? a : (x > b ? b : x) }
    function saturate(x) { return x < 0 ? 0 : (x > 1 ? 1 : x) }
    function random() { return Math.random() }
    function random_uniform(a, b) { return lerp(a, b, random()) }
    function random_distribute(a, b, exp) { return lerp(a, b, Math.pow(random(), exp)) }

    // XXX make a gif cache, but seperate players??

    function get_color(color) {
        if (COLORS[color])
            return COLORS[color];
        else
            return '#f00';
    }
    
    function get_gif_url(background) {
        var i = background.toLowerCase().indexOf('.gif');
        if (i < 0)
            return null;
        else
            return 'media/' + background;
    }

    var get_gif_player = _.memoize(url => new giflib.Player(url));

    function init_tile(ctx, _data) {

        data = _data.data;

        var gif = null;
        var bg_color = 'red';

        if (data.background) {
            var gif_url = get_gif_url(data.background);
            if (gif_url) {
                // FIXME don't start play every time (non-preview)
                // FIXME cache the gifs
                gif = get_gif_player(gif_url);
                //gif.play();
                bg_color = GIF_COLORS[data.background.split('.')[0]];

                if (!gif.frames[0]) {
                    gif.on_first_frame(function() {
                        // revisit the tile and redraw when first frame is available
                        var draw = init_tile(ctx, _data).draw;
                        draw({ preview: true });
                    });
                    // continue drawing with bg color...
                    //return { draw: function() {} };
                }
            } else {
                bg_color = data.background;
            }
        }

        var accent = get_color(data.accent);

        // for personality details
        function draw_circle(ctx, x, y, r, fill) {
            ctx.beginPath();
            ctx.arc(x, y, (fill ? 1 : 0.85)*r, 0, TWO_PI);
            ctx.closePath();
            fill ? ctx.fill() : ctx.stroke();
        }

        function draw_template1(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(60, 0);

            // subtitle
            ctx.translate(0, 180);
            ctx.font = '700 60px helvneue';
            ctx.fillStyle = COLORS.type_dark;
            ctx.fillText(d.subtitle.toUpperCase(), 0, 0);
            
            // title
            ctx.translate(0, 90);
            ctx.font = '700 92px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText(d.title.toUpperCase(), 0, 0);
            
            // underline
            ctx.translate(0, 50);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

            // players
            ctx.translate(0, 150);
            ctx.fillStyle = COLORS.type_light;
            _.each(d.players, function(player, index) {
                ctx.save();
                ctx.fillStyle = COLORS.type_light;

                ctx.translate(index * 435, 0);
                ctx.font = '700 65px helvneue';
                ctx.fillText(player.name.toUpperCase(), 0, 0);

                ctx.translate(0, 350);
                ctx.font = '600 450px tungsten';

                var N = ~~lerp(0, player.value, Math.pow(tt, 0.25));
                ctx.fillText(N, 0, 0);

                ctx.restore();
            });
        }

        function draw_template2(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(60, 0);

            // subtitle
            ctx.translate(0, 180);
            ctx.font = '700 60px helvneue';
            ctx.fillStyle = COLORS.type_dark;
            ctx.fillText(d.subtitle.toUpperCase(), 0, 0);
            
            // title
            ctx.translate(0, 90);
            ctx.font = '700 92px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText(d.title.toUpperCase(), 0, 0);
            
            // underline
            ctx.translate(0, 50);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

            // players
            ctx.translate(0, 148);
            ctx.fillStyle = COLORS.type_light;
            _.each(d.players, function(player, index) {
                ctx.save();
                ctx.fillStyle = COLORS.type_light;

                ctx.translate(index * 400, 0);
                ctx.font = '700 65px helvneue';
                ctx.fillText(player.name.toUpperCase(), 0, 0);

                ctx.translate(0, 225);
                ctx.font = '600 290px tungsten';

                var N = ~~lerp(0, parseInt(player.value), Math.pow(tt, 0.25));
                ctx.fillText(N, 0, 0);

                var w = ctx.measureText(N).width;
                ctx.font = '600 140px tungsten';
                ctx.fillText('%', w, 0);

                ctx.restore();
            });
        }

        function draw_template3(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(60, 0);

            // subtitle
            ctx.translate(0, 360);
            ctx.font = '700 60px helvneue';
            ctx.fillStyle = COLORS.type_dark;
            ctx.fillText(d.subtitle.toUpperCase(), 0, 0);
            
            // title
            ctx.translate(0, 90);
            ctx.font = '700 92px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText(d.title.toUpperCase(), 0, 0);
            
            // underline
            ctx.translate(0, 53);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

            // headings
            ctx.save();
                ctx.font = '600 55px helvneue';
                ctx.fillStyle = COLORS.type_light;
                ctx.translate(505, 48);
                _.each(d.headings, function(h) {
                    ctx.fillText(h.toUpperCase(), 0, 0);
                    ctx.translate(190, 0);
                });
            ctx.restore();


            // players
            ctx.translate(0, 80);
            ctx.fillStyle = COLORS.type_light;
            _.each(d.players, function(player, index) {
                ctx.save();

                ctx.translate(0, index * 190);

                var bar_h = 170;
                ctx.fillStyle = accent;
                ctx.fillRect(0, 0, cw - 120, bar_h);

                ctx.save();
                    ctx.fillStyle = COLORS.type_light;
                    ctx.translate(40, 115);
                    ctx.font = '700 57px helvneue';
                    ctx.fillText(player.name.toUpperCase(), 0, 0);
                ctx.restore();

                ctx.font = '600 90px tungsten';
                ctx.fillStyle = COLORS.type_light;
                ctx.save();
                    ctx.translate(500, 145);
                    _.each(player.values, function(v) {
                        ctx.font = '700 160px tungsten';
                        var N = ~~lerp(0, v, Math.pow(tt, 0.25));
                        ctx.fillText(N, 0, 0);
                        ctx.translate(190, 0);
                    });
                ctx.restore();

                ctx.restore();
            });
        }

        function draw_template4(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(68, 0);

            ctx.translate(0, 135);
            ctx.font = '700 77px helvneue';
            ctx.fillStyle = COLORS.type_light;
            var text = new INSIGHTS.TextRenderer(ctx, {
                text: d.text,
                rect: { x: 0, y: 0, w: TILE_W - 145, h: 1000 },
                line_height: 95
            });
            text.render(ctx, tt);

            // underline
            ctx.translate(5, text.bottom + 68);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

        }

        function draw_graphic(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);

            var cw = TILE_W;
            var ch = TILE_H;
            var margin = 100;

            ctx.textAlign = 'left';
            ctx.translate(margin, 0);

            ctx.save();

            // title
            if (d.title) {
                ctx.translate(0, 150);
                ctx.font = '700 70px helvneue';
                ctx.fillStyle = COLORS.type_light;
                ctx.fillText(d.title.toUpperCase(), 0, 0);
            }

            // subtitle
            if (d.subtitle) {
                ctx.translate(0, 120);
                ctx.font = '700 110px helvneue';
                ctx.fillStyle = COLORS.type_dark;
                ctx.fillText(d.subtitle.toUpperCase(), 0, 0);
            }

            // underline
            ctx.translate(0, 50);
            ctx.fillStyle = accent;
            var len = lerp(0, 500, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

            // number
            ctx.translate(0, 510);
            ctx.font = '600 600px tungsten';
            ctx.fillStyle = COLORS.type_light;

            var value = 75;
            var N = ~~lerp(0, value, Math.pow(tt, 0.25));
            ctx.fillText(''+N, 0, 0);

            ctx.restore();
        }

        function draw_personality_summary(ctx, time) {
            var d = data.summary;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.fillStyle = COLORS.darkblue1;
            ctx.fillRect(0, 0, cw, ch);

            ctx.fillStyle = COLORS.pink1;
            ctx.fillRect(0, 0, cw, 250);

            ctx.save()
            ctx.textAlign = 'right';
            ctx.translate(cw - 115, 125);

            ctx.font = '700 96px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText(d.player.name.toUpperCase(), 0, 0);

            ctx.translate(0, 78);
            ctx.font = '700 63px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText('is your US OPEN alter ego.', 0, 0);

            ctx.translate(0, 440);
            ctx.font = '600 250px tungsten';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText('%', 0, 0);

            // percent
            var w = ctx.measureText('%').width;
            ctx.font = '600 475px tungsten';

            // value
            var N = ~~lerp(0, 100 * d.score, Math.pow(tt, 0.25));
            ctx.fillText(N, -w-14, 0);

            // underline
            ctx.translate(0, 50);
            ctx.fillStyle = COLORS.pink1;
            var len = lerp(0, 690, smoothstep(tt));
            ctx.fillRect(-len, 0, len, 50);

            // of your personality traits are similar.
            ctx.fillStyle = COLORS.type_light;
            ctx.translate(0, 150);
            ctx.font = '700 63px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText('of your personality', 0, 0);
            ctx.fillText('traits are similar.', 0, 70);

            ctx.restore();

            // username
            ctx.save();
            ctx.translate(40, 300);
            ctx.rotate(0.5*Math.PI);

            ctx.font = '700 75px helvneue';
            ctx.fillStyle = COLORS.type_light;
            ctx.fillText(d.player.username.toUpperCase(), 0, 0);

            ctx.restore();
        }

        function draw_personality_details(ctx, time) {
            var d = data.details;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.fillStyle = COLORS.darkblue2;
            ctx.fillRect(0, 0, cw, ch);

            ctx.save();
            ctx.translate(cw/2 - 12, 155);

            ctx.textBaseline = 'middle';

            ctx.font = '700 72px helvneue';
            ctx.fillStyle = COLORS.type_light;

            var pw = 115;

            var n = d.players[0].username.toUpperCase();
            ctx.textAlign = 'right';
            ctx.fillText(n, -pw, 0);

            var n = d.players[1].username.toUpperCase();
            ctx.textAlign = 'left';
            ctx.fillText(n, pw, 0);

            // circles
            ctx.save();
                ctx.strokeStyle = ctx.fillStyle = COLORS.type_light;
                var r = 25;
                ctx.lineWidth = 10;
                draw_circle(ctx, -65, -10, r, true);
                draw_circle(ctx,  65, -10, r, false);
            ctx.restore();


            ctx.translate(0, 130);

            var trait_colors = [
                COLORS.blue1,
                COLORS.green1,
                COLORS.lime1,
                COLORS.yellow1,
                COLORS.pink1,
            ];

            ctx.lineWidth = 108;
            ctx.lineCap = 'round';
            
            ctx.font = '700 42px helvneue';
            ctx.fillStyle = COLORS.type_light;

            _.each(d.traits, function(names, index) {
                var w = 230;
                var tw = w + 90;

                ctx.beginPath();
                ctx.moveTo(-w, 0);
                ctx.lineTo(w, 0);
                ctx.strokeStyle = trait_colors[index];
                ctx.stroke();

                var n = titlecase(names[0]);
                ctx.textAlign = 'right';
                ctx.fillText(n, -tw, 5);

                var n = titlecase(names[1]);
                ctx.textAlign = 'left';
                ctx.fillText(n, tw, 5);

                ctx.save();
                    ctx.strokeStyle = ctx.fillStyle = COLORS.type_light;

                    var u = d.user.scores[index] * tt;
                    var x = u * (w - 30);
                    ctx.translate(x, 0);

                    var r = 25;
                    ctx.lineWidth = 10;

                    var fill = d.players[0].scores[index] < 0;
                    draw_circle(ctx, -1.3*r, 0, r, fill);
                    draw_circle(ctx,  1.3*r, 0, r, !fill);
                ctx.restore();

                ctx.translate(0, 132);
            });

            ctx.restore();
        }

        function draw_personality(ctx, time, loop_index) {
            if (loop_index & 1)
                draw_personality_details(ctx, time);
            else
                draw_personality_summary(ctx, time);
        }

        function draw(options) {
            var preview = !!options.preview;
            var PREVIEW_TIME = 4125 * 1.5;
            var time = preview ? PREVIEW_TIME : options.time;
            var background_only = options.background_only;

            // loop 5 secs
            var t = time / 5000;
            time = (t - Math.floor(t)) * 5000;
            var loop_index = ~~t;

            ctx.save();
            ctx.scale(ctx.canvas.width/TILE_W, ctx.canvas.height/TILE_H);

            var cw = TILE_W;
            var ch = TILE_H;

            // background

            if (!preview && gif) {
                var frame_index = Math.floor(time / 40);
                gif.draw_frame(frame_index);
                ctx.drawImage(gif.el, 0, 0, cw, ch);
            } else {
                if (gif && gif.frames[0]) {
                    console.log('frame0');
                    gif.draw_frame(0);
                    ctx.drawImage(gif.el, 0, 0, cw, ch);
                } else {
                    ctx.fillStyle = bg_color;
                    ctx.fillRect(0, 0, cw, ch);
                }
            }

            ctx.save();
            switch (data.type) {
            case 'template-1':
                draw_template1(ctx, time);
                break;

            case 'template-2':
                draw_template2(ctx, time);
                break;

            case 'template-3':
                draw_template3(ctx, time);
                break;

            case 'template-4':
                draw_template4(ctx, time);
                break;

            case 'personality':
                draw_personality(ctx, time, loop_index);
                break;

            default:
                // ignore
                break;
            }
            ctx.restore();

            // draw the guide
            //if (data.type != 'template-1' && data.type != 'template-2' && data.type != 'template-3' && data.type != 'template-4')
            if (0)
            {
                var guide = guides[data.type];
                if (guide) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(guide, 0, 0, cw, ch);
                }
            }

            ctx.restore();
        }

        return { draw: draw };
    }

    return {
        init_tile: init_tile
    };

}());
