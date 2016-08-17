var INSIGHTS_2016 = (function() {

    var TILE_ASPECT = 6/5;
    var TILE_H = 1000;
    var TILE_W = TILE_H * TILE_ASPECT

    var COLORS = {
        court_blue: '#064BA6',
        blue: '#0663C9',
        teal: '#1FD5DF',
        pink: '#FF50A0',
        grass: '#ADE222',
        green: '#35D87F',
        yellow: '#EFB40F',
        white: '#FFFFFF'
    };

    var PALETTES = [
        { bg: COLORS.blue, fg: COLORS.yellow },
        { bg: COLORS.teal, fg: COLORS.yellow },
        { bg: COLORS.pink, fg: COLORS.green },
        { bg: COLORS.grass, fg: COLORS.pink },
        { bg: COLORS.green, fg: COLORS.pink },
        { bg: COLORS.yellow, fg: COLORS.teal }
    ];

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
            return color;
    }

    function init_tile(ctx, data) {

        var gif = null;
        if (data.background.video) {
            // FIXME don't start play every time (non-preview)
            gif = new giflib.Player(data.background.video);
            gif.play();
        }

        function draw_graphic(ctx, time) {
            var d = data.graphic;
            var tt = Math.min(1, time/1000);

            var cw = TILE_W;
            var ch = TILE_H;
            var margin = 100;

            if (d.align == 'right') {
                ctx.textAlign = 'right';
                ctx.translate(cw - margin, 0);
            } else {
                ctx.textAlign = 'left';
                ctx.translate(margin, 0);
            }

            ctx.save();

            // title
            ctx.translate(0, 150);
            ctx.font = '700 70px helvneue';
            ctx.fillStyle = get_color(d.title.color);
            ctx.fillText(d.title.text.toUpperCase(), 0, 0);

            // subtitle
            ctx.translate(0, 120);
            ctx.font = '700 110px helvneue';
            ctx.fillStyle = get_color(d.subtitle.color);
            ctx.fillText(d.subtitle.text.toUpperCase(), 0, 0);

            // underline
            ctx.translate(0, 50);
            ctx.fillStyle = get_color(d.underline.color);
            var len = lerp(0, 500, smoothstep(tt));
            if (d.align == 'right')
                ctx.fillRect(-len, 0, len, 50);
            else
                ctx.fillRect(0, 0, len, 50);

            // number
            ctx.translate(0, 510);
            ctx.font = '600 600px tungsten';
            ctx.fillStyle = get_color(d.number.color);

            var value = parseFloat(d.number.value);
            var N = ~~lerp(0, value, Math.pow(tt, 0.25));
            ctx.fillText(''+N, 0, 0);

            ctx.restore();
        }

        function draw(options) {
            var preview = !!options.preview;
            var PREVIEW_TIME = 4125 * 1.5;
            var time = preview ? PREVIEW_TIME : options.time;
            var background_only = options.background_only;

            ctx.save();
            ctx.scale(ctx.canvas.width/TILE_W, ctx.canvas.height/TILE_H);

            var cw = TILE_W;
            var ch = TILE_H;

            if (!preview && gif) {
                ctx.drawImage(gif.el, 0, 0, cw, ch);
            } else {
                ctx.fillStyle = COLORS.court_blue;
                ctx.fillRect(0, 0, cw, ch);
            }

            /*
            var u = clamp(time / 1000, 0, 1);
            u = smoothstep(u);
            ctx.beginPath();
            ctx.moveTo(cw/2, ch/2);
            ctx.arc(cw/2, ch/2, ch/4, 0, u*TWO_PI);
            ctx.closePath();
            ctx.fillStyle = COLORS.green;
            ctx.fill();
            */

            ctx.save();
            draw_graphic(ctx, time);
            ctx.restore();

            ctx.restore();
        }

        return {
            id: data.id,
            data: data,
            draw: draw
        };
    }

    return {
        init_tile: init_tile
    };

}());
