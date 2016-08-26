var INSIGHTS = (function() {

    function make_url(url_path) {
        return INSIGHTS.prefix + url_path;
    }

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
        var accent = get_color(data.accent);

        var images = {
            by_watson: load_image('img/by-watson.png'),
            pp_cta: load_image('img/pp-cta-600x500.png')
        };

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

                var fontsize = player.fontsize;
                if (fontsize) {
                    ctx.save();
                    ctx.scale(fontsize, fontsize);
                }

                ctx.fillText(player.name.toUpperCase(), 0, 0);

                if (fontsize) {
                    ctx.restore();
                }

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

                var fontsize = player.fontsize;
                if (fontsize) {
                    ctx.save();
                    ctx.scale(fontsize, fontsize);
                }

                ctx.fillText(player.name.toUpperCase(), 0, 0);

                if (fontsize) {
                    ctx.restore();
                }

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
            ctx.translate(0, 210);
            ctx.font = '700 60px helvneue';
            ctx.fillStyle = COLORS.type_dark;
            ctx.fillText(d.subtitle.toUpperCase(), 0, 0);
            
            // title
            ctx.translate(0, 90);
            ctx.font = '700 80px helvneue';
            ctx.fillStyle = COLORS.type_light;
            var title = d.title.toUpperCase();
            ctx.fillText(title, 0, 0);

            // detail
            if (d.detail) {
                var tw = ctx.measureText(title).width;
                ctx.font = '700 60px helvneue';
                ctx.fillText(d.detail.toUpperCase(), tw + 18, 0);
            }
            
            // underline
            ctx.translate(0, 53);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);

            var column_w = 202;

            // headings
            ctx.save();
                ctx.font = '600 55px helvneue';
                ctx.fillStyle = COLORS.type_light;
                ctx.translate(505, 48);
                _.each(d.headings, function(h) {
                    ctx.fillText(h.toUpperCase(), 0, 0);
                    ctx.translate(column_w, 0);
                });
            ctx.restore();

            // players
            ctx.translate(0, 80);
            ctx.fillStyle = COLORS.type_light;
            _.each(d.players, function(player, index) {
                ctx.save();

                ctx.translate(0, index * column_w);

                var bar_h = 170;
                ctx.fillStyle = accent;
                ctx.fillRect(0, 0, cw - 120, bar_h);

                ctx.save();
                    ctx.fillStyle = COLORS.type_light;
                    ctx.translate(40, 115);
                    ctx.font = '700 57px helvneue';

                    var fontsize = player.fontsize;
                    if (fontsize) {
                        ctx.save();
                        ctx.scale(fontsize, fontsize);
                    }

                    ctx.fillText(player.name.toUpperCase(), 0, 0);

                    if (fontsize) {
                        ctx.restore();
                    }
                ctx.restore();

                ctx.font = '600 90px tungsten';
                ctx.fillStyle = COLORS.type_light;
                ctx.save();
                    ctx.translate(500, 145);
                    _.each(player.values, function(v) {
                        ctx.font = '700 160px tungsten';
                        var N = ~~lerp(0, v, Math.pow(tt, 0.25));
                        ctx.fillText(N, 0, 0);
                        ctx.translate(column_w, 0);
                    });
                ctx.restore();

                ctx.restore();
            });
        }

        var text_template4 = null;

        function draw_template4(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(68, 0);

            ctx.translate(0, 135);
            ctx.font = '400 80px helvneue';
            ctx.fillStyle = COLORS.type_light;
            var text = text_template4 || (text_template4 = new TextRenderer(ctx, {
                text: d.text,
                rect: { x: 0, y: 0, w: TILE_W - 145, h: 1000 },
                line_height: 96
            }));
            text.render(ctx, 1);    // no fade

            // underline
            ctx.translate(5, text.bottom + 68);
            ctx.fillStyle = accent;
            var len = lerp(0, 430, smoothstep(tt));
            ctx.fillRect(0, 0, len, 50);
        }

        var text_news_analyzer = null;

        function draw_news_analyzer(ctx, time) {
            var d = data;
            var tt = Math.min(1, time/1000);
            var cw = TILE_W;
            var ch = TILE_H;

            ctx.textAlign = 'left';
            ctx.translate(130, 150);

            // underline + title
            //ctx.translate(5, text.bottom + 68);

            ctx.font = '400 60px helvneue';
            var title = d.title.toUpperCase();
            var tw = ctx.measureText(title).width;

            ctx.fillStyle = accent;
            var len = lerp(0, tw + 40, smoothstep(tt));
            ctx.fillRect(0, 0, len, 72);

            ctx.fillStyle = COLORS.type_light;
            ctx.globalAlpha = saturate(tt*2);
            ctx.fillText(title, 20, 56);
            ctx.globalAlpha = 1.0;

            ctx.translate(0, 155);
            var text = text_news_analyzer || (text_news_analyzer = new TextRenderer(ctx, {
                text: d.text,
                rect: { x: 0, y: 0, w: TILE_W - 300, h: 1000 },
                line_height: 75
            }));
            text.render(ctx, tt);

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
                ctx.fillText(d.player.toUpperCase(), 0, 0);

                ctx.translate(0, 78);
                ctx.font = '400 63px helvneue';
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
                    ctx.font = '400 53px helvneue';
                } else {
                    ctx.translate(0, 150);
                    ctx.font = '400 63px helvneue';
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
                ctx.fillText(d.username.toUpperCase(), 0, 0);

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

            var n = d.players[0].name.toUpperCase();
            ctx.textAlign = 'right';
            ctx.fillText(n, -pw2, 0);

            var n = d.players[1].name.toUpperCase();
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
            
            ctx.font = '400 42px helvneue';
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

                    var r = 25;
                    ctx.lineWidth = 10;

                    var u = d.players[0].scores[index] * tt;
                    var x = u * (w - 30);
                    draw_circle(ctx, x, 0, r, false);

                    var u = d.players[1].scores[index] * tt;
                    var x = u * (w - 30);
                    draw_circle(ctx, x, 0, r, true);
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

            // some tiles should play only once
            var time2 = loop_index ? 5000 : time;

            if (format == 'p11') {
                if ((loop_index & 1) == 0) {
                    draw_personality_summary(ctx, time, TILE_W, TILE_H);
                } else {
                    draw_personality_details(ctx, time, TILE_W, TILE_H);
                }
            }
            else if (format == 'p21') {
                draw_personality_summary(ctx, time2, TILE_W/2, TILE_H);
                ctx.translate(TILE_W/2, 0);
                draw_personality_details(ctx, time2, TILE_W/2, TILE_H);
            }
            else if (format == 'p31') {
                draw_personality_summary(ctx, time2, 4*320, TILE_H);
                ctx.translate(4*320, 0);
                draw_personality_details(ctx, time2, 4*(940-320), TILE_H);
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

            if (options.background) {
                // blah
            }

            // loop 5 secs
            var t = time / 5000;
            time = (t - Math.floor(t)) * 5000;
            var loop_index = ~~t;

            ctx.save();
            ctx.scale(ctx.canvas.width/TILE_W, ctx.canvas.height/TILE_H);

            var cw = TILE_W;
            var ch = TILE_H;

            // background
            ctx.clearRect(0, 0, cw, ch);

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

            case 'news-analyzer':
                draw_news_analyzer(ctx, time);
                break;

            case 'personality':
                draw_personality(ctx, time, loop_index, preview);
                break;

            default:
                // ignore
                break;
            }
            ctx.restore();

            if (0 && data.guide) {
                var guide = load_image('guides/' + data.guide);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 0.5;
                ctx.drawImage(guide, 0, 0, cw, ch);
            }

            ctx.restore();
        }

        return { draw: draw };
    }

    if (typeof CanvasRenderingContext2D == 'undefined') {
        // canvas unsupported: bail
        console.warn('INSIGHTS: canvas not supported.');

        return {
            is_supported: false,
            preview: function(data, arg) { return new Image() },
            play: function(data, canvas) { return new Image() },
            stop: function() {},
            fonts_loaded: function() {},
            load_fonts: function(callback) {}
        };
    }

    function create_canvas_context(options) {
        var data = options.data;
        var canvas = options.canvas || document.createElement('canvas');

        var ctx = canvas.getContext('2d');
        var ratio = get_canvas_pixel_ratio(ctx);
        var dip_size = get_tile_dip_size(data, !!options.preview);
        var aspect = dip_size[0] / dip_size[1];

        var w = options.width || dip_size[0];
        var h = w / aspect;

        var cw = Math.floor(ratio * w);
        var ch = Math.floor(ratio * h);

        canvas.width = cw;
        canvas.height = ch;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';

        return ctx;
    }

    // maths
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

    // utils
    function base64_decode(src, type) {
        var raw = atob(src);
        var len = raw.length;
        var buf = new ArrayBuffer(len);
        var dst = new Uint8Array(buf);
        for (var i = 0; i < len; ++i)
            dst[i] = raw.charCodeAt(i);

        return type ? new type(buf) : buf;
    }

    function base64_encode(src) {
        if (src instanceof ArrayBuffer)
            src = new Uint8Array(src);
        else
            src = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);

        var len = src.length;
        var dst = '';
        for (var i = 0; i < len; ++i)
            dst += String.fromCharCode(src[i]);

        return btoa(dst);
    }

    // shims
    (function() {
        // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame =
              window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());

    if (!CanvasRenderingContext2D.prototype.ellipse) {
        CanvasRenderingContext2D.prototype.ellipse = function(
            x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise)
        {
            this.save();
            this.translate(x, y);
            this.rotate(rotation);
            this.scale(radiusX, radiusY);
            this.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
            this.restore();
        }
    }

    // canvas helpers
    function get_canvas_pixel_ratio(ctx) {
        var dpr = window.devicePixelRatio || 1;
        var bspr = (
            ctx.webkitBackingStorePixelRatio ||
            ctx.mozBackingStorePixelRatio ||
            ctx.msBackingStorePixelRatio ||
            ctx.oBackingStorePixelRatio ||
            ctx.backingStorePixelRatio || 1);
        return dpr / bspr;
    }

    // word-wrapped text
    function TextRenderer(ctx, options) {
        var text = options.text.trim();
        var rect = options.rect;
        var line_height = options.line_height;

        var tx0 = rect.x;
        var tx1 = tx0 + rect.w;
        var ty0 = rect.y;
        var ty1 = ty0 + rect.h;

        var blocks = [];

        var re_wordsep = /(\s+|[^\s\w]*\w+[^0-9\W]-(?=\w+[^0-9\W]))/;
        var chunks = text.split(re_wordsep);

        var tx = tx0;
        var ty = ty0;

        _.each(chunks, function(chunk) {
            var newlines = 0;
            _.each(chunk, function(c) { if (c == '\n') ++newlines });
            if (newlines) {
                ty += newlines * line_height;
                tx = tx0;
                return;
            }

            var tw = ctx.measureText(chunk).width;

            if (tx > tx0 && (tx + tw > tx1)) {
                ty += line_height;
                tx = tx0;

                // XXX hack to stop space at start of line
                if (chunk == ' ')
                    tw = 0;
            }

            chunk = chunk.trim();

            if (chunk) {
                blocks.push({
                    text: chunk.trim(),
                    x: tx,
                    y: ty
                });
            }

            tx += tw;
        });

        this.blocks = blocks;
        //this.bottom = (tx == tx0) ? ty : (ty + line_height);
        this.bottom = ty;
    }

    TextRenderer.prototype.render = function(ctx, opacity) {
        ctx.save();
        ctx.globalAlpha = saturate(opacity);
        var blocks = this.blocks;
        var n_blocks = blocks.length;
        for (var i = 0; i < n_blocks; ++i) {
            var block = blocks[i];
            ctx.fillText(block.text, block.x, block.y);
        }
        ctx.restore();
    };

    function resize_canvas(canvas, ratio) {
        var w = ~~(ratio * canvas.clientWidth);
        var h = ~~(ratio * canvas.clientHeight);
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;
    }

    // this init function takes the data and returns the drawing function for that tile
    // so we can patch in other graphics here!
    function init(ctx, data) {
        if (data.version == '2016') {
            // patch new version
            return init_tile(ctx, data).draw;
        } else {
            console.assert(data.graphic);
            return null;
        }
    }

    var animate = (function() {

        var ctx = null;
        var ratio = 1;
        var redraw = null;
        var start_time = 0;

        function animation_callback(time) {
            if (!ctx) return;
            requestAnimationFrame(animation_callback);

            if (!start_time)
                start_time = time;

            resize_canvas(ctx.canvas, ratio);
            redraw({ time: time - start_time });
        }

        return function(data, new_ctx) {
            if (!data || !new_ctx) {
                // stops the animation loop
                ctx = null;
                redraw = null;
                return;
            }

            ctx = new_ctx;

            if (ctx) {
                redraw = init(ctx, data);
                start_time = 0;
                animation_callback(0);
            }
        };

    }());

    // queue of preview tasks due to unloaded fonts
    var previews_todo = [];
    function do_previews() {
        previews_todo.forEach(function(o) {
            var ctx = o.canvas.getContext('2d');
            init(ctx, o.data)({ preview: true });
        });
        previews_todo = null;
    }

    // remove the extension
    function get_basename(url) {
        var idx = url.lastIndexOf('.');
        if (idx > 0)
            return url.substring(0, idx);
        else
            return url;
    }

    function create_insights_tile(canvas, background) {
        var $el = $('<div>').addClass('insights-tile');
        $el.css({ width: canvas.style.width, height: canvas.style.height });

        if (background) {
            var basename = get_basename(background);
            var img = new Image;
            img.src = make_url('media/' + basename + '.png');
            $el.append($(img).addClass('insights-tile-layer'));
        }

        $el.append($(canvas).addClass('insights-tile-layer'));
        return $el[0];
    }

    // only one tile can animate at one time
    var animating_tile = null;

    function play_insights_tile_background_image(el) {
        if (el === animating_tile)
            return;

        // stop the old tile
        if (animating_tile) {
            set_insights_tile_background_image_play_state(animating_tile, false);
            animating_tile = null;
        }

        // start the new tile
        if (el) {
            animating_tile = el;
            set_insights_tile_background_image_play_state(el, true);
        }
    }

    function set_insights_tile_background_image_play_state(el, play) {
        if (!el)
            return;

        var img = $(el).find('img.insights-tile-layer')[0];
        if (!img)
            return;

        var basename = get_basename(img.src);
        var png = basename + '.png';
        var gif = basename + '.gif';
        img.src = play ? gif : png;
    }

    // -- 2016 animations code --
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

    function get_tile_dip_size(data, preview) {
        if (preview)
            return dip_sizes.std;
        else
            return dip_sizes[get_format(data)];
    }

    var load_image = _.memoize(function(src_path) {
        var img = new Image;
        img.src = make_url(src_path);
        //console.log('load_image:', img.src);
        return img;
    });

    function titlecase(s) {
        return s.substr(0,1).toUpperCase() + s.substr(1);
    }

    var COLORS = {
        // typography
        type_dark: '#033f68',
        type_light: '#ffffff',

        // scores+more
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
        darkblue2: '#1956c6',

        // other
        warning: '#f00'
    };

    function get_color(color) {
        return COLORS[color] || COLORS.warning;
    }

    return {
        is_supported: true,

        prefix: '',

        shareable: function(data, width) {
            // FIXME

            var ctx = create_canvas_context({ data: data, width: width, preview: true });
            init(ctx, data)({ preview: true });

            /*
            var tile = (function() {
                var ctx = get_canvas_context(null, 600);
                init(ctx, data)({ preview: true });
                return ctx.canvas;
            }());

            var ctx = get_canvas_context(null, 1200, 600);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 1200, 600);
            ctx.drawImage(tile, 300, 0);

            var img = load_image('imgs/logo_bar_only.png');
            ctx.drawImage(img, 300, 600 - img.height);
            else
                console.warn('INSIGHTS: logo not ready');
            */
           
            return ctx.canvas;
        },

        preview: function(data, arg) {
            var o = {
                data: data.data,
                preview: true
            };

            var canvas, el;
            if (_.isNumber(arg)) {
                o.width = arg;
            }
            else if ($(arg).hasClass('insights-tile')) {
                el = arg;
                o.canvas = $(el).find('canvas.insights-tile-layer')[0];
            }

            var ctx = create_canvas_context(o);

            init(ctx, data)({
                preview: true,
                background_only: !!previews_todo
            });

            // is this correct? what about ratio?
            if (previews_todo) {
                previews_todo.push({
                    canvas: ctx.canvas,
                    data: data
                });
            }

            if (!el)
                el = create_insights_tile(ctx.canvas, data.data.background);

            return el;
        },

        render: function(options) {
            console.assert(!previews_todo, 'fonts not loaded');
            var canvas = this.shareable(options.data, options.width);

            var data = options.data.data;
            if (!data.background)
                callback_with_canvas(canvas);

            var src_path = 'media/' + get_basename(data.background) + '.png';
            var background_image = load_image(src_path);
            background_image.onload = function() {
                var c = document.createElement('canvas');
                c.width = canvas.width;
                c.height = canvas.height;
                var ctx = c.getContext('2d');
                ctx.drawImage(background_image, 0, 0, c.width, c.height);
                ctx.drawImage(canvas, 0, 0);
                callback_with_canvas(c);
            };

            function callback_with_canvas(c) {
                var result = c;

                if (options.base64) {
                    var data_url = c.toDataURL('png');
                    var m = data_url.match(/^data:(.*?);base64,/);
                    console.assert(m);
                    result = data_url.substr(m[0].length);
                }

                if (options.callback)
                    options.callback(result);
            }

            //var data_url = canvas.toDataURL('png');
            //var m = data_url.match(/^data:(.*?);base64,/);
            //console.assert(m);
            //return data_url.substr(m[0].length);
        },

        play: function(data, el, width) {
            var canvas;
            if (el && $(el).hasClass('insights-tile')) {
                canvas = $(el).find('canvas.insights-tile-layer')[0];
            }

            var ctx = create_canvas_context({
                data: data.data,
                canvas: canvas,
                width: width
            });

            if (!el)
                el = create_insights_tile(ctx.canvas, data.data.background);

            play_insights_tile_background_image(el);
            animate(data, ctx);
            return el;
        },

        stop: function() {
            play_insights_tile_background_image(null);
            animate(null, null);
        },

        fonts_loaded: function() {
            do_previews();
        },

        load_fonts: function(callback) {
            WebFont.load({
                custom: {
                    families: [
                        'helvneue:n2,n4,n7',
                        'tungsten:n6'
                    ],
                    urls: [ make_url('css/fonts.css') ]
                },
                active: function() {
                    INSIGHTS.fonts_loaded();
                    callback();
                }
            });
        }
    };

}());

if (typeof module != 'undefined')
    module.exports = INSIGHTS;
