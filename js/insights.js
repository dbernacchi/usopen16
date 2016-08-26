var INSIGHTS = (function() {

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
        var dip_size = INSIGHTS_2016.get_dip_size(data, !!options.preview);
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
    function random() { return Math.random() }
    function random_uniform(a, b) { return lerp(a, b, random()) }
    function random_distribute(a, b, exp) { return lerp(a, b, Math.pow(random(), exp)) }

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
            //console.assert(data.graphic);
            //return init_tile3(ctx, data).draw;
        if (data.version == '2016') {
            // patch new version
            return INSIGHTS_2016.init_tile(ctx, data).draw;
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

    var shareable_logo = (function() {
        var img = new Image();
        img.src = 'img/logo_bar_only.png';
        return img;
    }());

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
            img.src = 'media/' + basename + '.png';
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

    return {
        is_supported: true,

        shareable: function(data) {
            // FIXME

            var ctx = create_canvas_context({ data: data, preview: true });
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

            if (shareable_logo.complete)
                ctx.drawImage(shareable_logo, 300, 600-shareable_logo.height);
            else
                console.warn('INSIGHTS: logo not ready');
            */
           
            return ctx.canvas;
        },

        shareable_base64: function(data) {
            var image = this.shareable(data);
            var data_url = image.toDataURL('png');
            var m = data_url.match(/^data:(.*?);base64,/);
            return data_url.substr(m[0].length);
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

        preview_base64: function(data, size) {
            console.assert(!previews_todo, 'fonts not loaded');

            var canvas = this.shareable(data, size);
            var data_url = canvas.toDataURL('png');
            var m = data_url.match(/^data:(.*?);base64,/);
            console.assert(m);
            return data_url.substr(m[0].length);
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
                    urls: [ 'css/fonts.css' ]
                },
                active: function() {
                    INSIGHTS.fonts_loaded();
                    callback();
                }
            });
        },

        TextRenderer: TextRenderer,
        get_canvas_pixel_ratio: get_canvas_pixel_ratio,
    };

}());

if (typeof module != 'undefined')
    module.exports = INSIGHTS;
