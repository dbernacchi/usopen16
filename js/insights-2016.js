var INSIGHTS_2016 = (function() {

    var dip_sizes = {
        std: [300, 250],
        p11: [300, 250],
        p21: [620, 330],
        p31: [940, 372],
        p12: [300, 600]
    };
    
    function get_format(data) {
        if (data.type != 'personality')
            return 'std';

        switch (data.format) {
            case '1:1': return 'p11';
            case '2:1': return 'p21';
            case '3:1': return 'p31';
            case '1:2': return 'p12';
            default:
                console.assert('personality: incorrect format.');
                return '?';
        }
    }

    function load_image(src) {
        var img = new Image;
        img.src = src;
        return img;
    }

    var images = {
        by_watson: load_image('img/by-watson.png'),
        pp_cta: load_image('img/pp-cta-600x500.png'),

        // guide images
        //p21: load_image('guides/pp_2x1.png'),
        //p31: load_image('guides/pp_3x1.png'),
        //p12: load_image('guides/pp_1x2.png')
        //p11a: load_image('guides/pp_1x1a_320x250.png'),
        //p11b: load_image('guides/pp_1x1b_320x250.png'),
        //p11c: load_image('guides/pp_1x1c_320x250.png'),
    };

    function titlecase(s) {
        return s.substr(0,1).toUpperCase() + s.substr(1);
    }

    // "logical" size
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

    var get_gif_player = _.memoize(function(url) {
        return new giflib.Player(url);
    });

    function init_tile(ctx, _data) {

        data = _data.data;
        var format = get_format(data);
        var dip_size = dip_sizes[format];

        var DESIGN_RATIO = 4.0;
        var TILE_W = DESIGN_RATIO * dip_size[0];
        var TILE_H = DESIGN_RATIO * dip_size[1];
        var TILE_ASPECT = TILE_W / TILE_H;

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
                        // need to scale to avoid retina issues
                        // XXX why is this context in a weird transform state?
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
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

        function draw_personality_summary(ctx, time, cw, ch) {
            var d = data.summary;
            var tt = Math.min(1, time/1000);

            // background
            ctx.fillStyle = COLORS.darkblue1;
            ctx.fillRect(0, 0, cw, ch);

            // pink header bar
            var pink_height = 350;
            if (format == 'p21')
                pink_height = 400;
            else if (format == 'p31') {
                //cw *= 1.02; // weird
                pink_height = 490;
            }

            ctx.fillStyle = COLORS.pink1;
            ctx.fillRect(0, 0, cw, pink_height);

            ctx.save()

                ctx.textAlign = 'right';
                ctx.translate(cw - 115, pink_height - 165);

                ctx.font = '700 96px helvneue';
                ctx.fillStyle = COLORS.type_light;
                ctx.fillText(d.player.name.toUpperCase(), 0, 0);

                ctx.translate(0, 78);
                ctx.font = '700 63px helvneue';
                ctx.fillStyle = COLORS.type_light;
                ctx.fillText('is your US OPEN alter ego.', 0, 0);

            ctx.restore();

            ctx.save();

                ctx.textAlign = 'right';

                var ty = 480;
                if (format == 'p11') {
                    ty = 370;
                }

                ctx.translate(cw - 115, pink_height + ty);

                if (format == 'p11')
                    ctx.font = '600 290px tungsten';
                else
                    ctx.font = '600 340px tungsten';

                ctx.fillStyle = COLORS.type_light;
                ctx.fillText('%', 0, 0);

                // percent
                var w = ctx.measureText('%').width;

                if (format == 'p11')
                    ctx.font = '600 500px tungsten';
                else
                    ctx.font = '600 600px tungsten';

                // value
                var N = ~~lerp(0, 100 * d.score, Math.pow(tt, 0.25));
                ctx.fillText(N, -w-14, 0);

                // underline
                ctx.translate(0, 50);
                ctx.fillStyle = COLORS.pink1;
                tt = 1;

                var line_len = 690;
                if (format == 'p11')
                    line_len = 590;

                var len = lerp(0, line_len, smoothstep(tt));
                ctx.fillRect(-len, 0, len, 50);

                // of your personality traits are similar.
                ctx.fillStyle = COLORS.type_light;

                if (format == 'p11') {
                    ctx.translate(0, 120);
                    ctx.font = '700 53px helvneue';
                } else {
                    ctx.translate(0, 150);
                    ctx.font = '700 63px helvneue';
                }

                ctx.fillStyle = COLORS.type_light;
                ctx.fillText('of your personality', 0, 0);
                ctx.fillText('traits are similar.', 0, 70);

            ctx.restore();

            // username
            ctx.save();

                var tx = 50;
                var ty = 40;

                if (format == 'p21')
                    tx += 25;
                else if (format == 'p31')
                    tx += 60;
                
                if (format == 'p11') {
                    ty -= 30;
                    ctx.font = '700 51px helvneue';
                } else {
                    ctx.font = '700 64px helvneue';
                }

                ctx.translate(tx, pink_height + ty);
                ctx.rotate(0.5*Math.PI);

                ctx.fillStyle = COLORS.type_light;
                ctx.fillText(d.player.username.toUpperCase(), 0, 0);

            ctx.restore();
        }

        function draw_personality_details(ctx, time, cw, ch) {
            var d = data.details;
            var tt = Math.min(1, time/1000);

            ctx.fillStyle = COLORS.darkblue2;
            ctx.fillRect(0, 0, cw, ch);

            ctx.save();

            var ty = 180;
            if (format == 'p21')
                ty += 60;
            else if (format == 'p31')
                ty += 150;
            else if (format == 'p11')
                ty -= 80;

            ctx.translate(cw/2 - 12, ty);

            ctx.textBaseline = 'middle';

            ctx.font = '700 40px helvneue';
            ctx.fillStyle = COLORS.type_light;

            var pw = 48;            // circle tx
            var pw2 = pw + 40;      // username tx

            var n = d.players[0].username.toUpperCase();
            ctx.textAlign = 'right';
            ctx.fillText(n, -pw2, 0);

            var n = d.players[1].username.toUpperCase();
            ctx.textAlign = 'left';
            ctx.fillText(n, pw2, 0);

            // circles
            ctx.save();
                ctx.strokeStyle = ctx.fillStyle = COLORS.type_light;
                var r = 25;
                ctx.lineWidth = 10;
                draw_circle(ctx, -pw, -10, r, true);
                draw_circle(ctx,  pw, -10, r, false);
            ctx.restore();


            if (format == 'p11')
                ctx.translate(0, 150);
            else
                ctx.translate(0, 180);

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

            var bar_width = 230;
            if (format == 'p31')
                bar_width = 610;

            _.each(d.traits, function(names, index) {
                var w = bar_width;
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

                ctx.translate(0, 120);
            });

            ctx.save();
                var ty = 0;
                if (format == 'p11')
                    ty -= 25;

                var s = 1.20;
                ctx.scale(s, s);
                ctx.drawImage(images.by_watson, -images.by_watson.width/2, ty);
            ctx.restore();

            ctx.restore();
        }

        function draw_personality(ctx, time, loop_index, preview) {
            if (preview) {
                ctx.drawImage(images.pp_cta, 0, 0, TILE_W, TILE_H);
                return;
            }

            function draw_guide(name, dy) {
                var img = images[name];
                ctx.save();
                ctx.scale(0.5*DESIGN_RATIO, 0.5*DESIGN_RATIO);
                ctx.globalAlpha = 0.50;
                ctx.globalCompositeOperation = 'darker';
                ctx.drawImage(img, 0, dy || 0);
                ctx.restore();
            }

            ctx.save();

            if (format == 'p11') {
                if ((loop_index & 1) == 0) {
                    draw_personality_summary(ctx, time, TILE_W, TILE_H);
                } else {
                    draw_personality_details(ctx, time, TILE_W, TILE_H);
                }
            }
            else if (format == 'p21') {
                draw_personality_summary(ctx, time, TILE_W/2, TILE_H);
                ctx.translate(TILE_W/2, 0);
                draw_personality_details(ctx, time, TILE_W/2, TILE_H);
            }
            else if (format == 'p31') {
                draw_personality_summary(ctx, time, 4*320, TILE_H);
                ctx.translate(4*320, 0);
                draw_personality_details(ctx, time, 4*(940-320), TILE_H);
            }
            else if (format == 'p12') {
                draw_personality_summary(ctx, time, TILE_W, TILE_H/2);
                ctx.translate(0, TILE_H/2);
                draw_personality_details(ctx, time, TILE_W, TILE_H/2);
            }

            ctx.restore();

            // guides
            if (0) {
                if (format == 'p11') {
                    draw_guide('p11b', 0);
                } else {
                    draw_guide(format);
                }
            }
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
                draw_personality(ctx, time, loop_index, preview);
                break;

            default:
                // ignore
                break;
            }
            ctx.restore();

            ctx.restore();
        }

        return { draw: draw };
    }

    return {
        init_tile: init_tile,
        get_dip_size: function(data, preview) {
            if (preview)
                return dip_sizes.std;
            else
                return dip_sizes[get_format(data)];
        }
    };

}());
