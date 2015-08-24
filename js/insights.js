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

    // vecmaths

    if (typeof Float32Array == 'undefined')
        window.Float32Array = Array;

    function vec3_create() {
        var v = new Float32Array(3);
        v[0] = 0; v[1] = 0; v[2] = 0;
        return v;
    }

    function vec3_normalize(v) {
        var x = v[0], y = v[1], z = v[2];
        var ll = x*x + y*y + z*z;
        if (ll > 0) {
            var r = 1/Math.sqrt(ll);
            v[0] *= r;
            v[1] *= r;
            v[2] *= r;
        }
        return v;
    }

    function vec3_random_unit(v) {
        v[0] = 2 * (random() - 0.5);
        v[1] = 2 * (random() - 0.5);
        v[2] = 2 * (random() - 0.5);
        return vec3_normalize(v);
    }

    function quat_create() {
        var v = new Float32Array(4);
        v[0] = 0; v[1] = 0; v[2] = 0; v[3] = 1;
        return v;
    }

    function quat_rotate_z(a, rad) {
        rad *= 0.5;
        var ax = a[0], ay = a[1], az = a[2], aw = a[3];
        var bz = Math.sin(rad), bw = Math.cos(rad);
        a[0] = ax * bw + ay * bz;
        a[1] = ay * bw - ax * bz;
        a[2] = az * bw + aw * bz;
        a[3] = aw * bw - az * bz;
        return a;
    }

    function quat_lerp(a, b, t) {
        a[0] = (1-t)*a[0] + t*b[0];
        a[1] = (1-t)*a[1] + t*b[1];
        a[2] = (1-t)*a[2] + t*b[2];
        a[3] = (1-t)*a[3] + t*b[3];
    }

    function quat_normalize(v) {
        var x = v[0], y = v[1], z = v[2], w = v[3];
        var ll = x*x + y*y + z*z + w*w;
        if (ll > 0) {
            var r = 1/Math.sqrt(ll);
            v[0] *= r;
            v[1] *= r;
            v[2] *= r;
            v[3] *= r;
        }
        return v;
    }

    function quat_axis_angle(out, axis, rad) {
        rad = rad * 0.5;
        var s = Math.sin(rad);
        out[0] = s * axis[0];
        out[1] = s * axis[1];
        out[2] = s * axis[2];
        out[3] = Math.cos(rad);
        return out;
    }

    function vec3_transform_quat(a, q) {
        var x = a[0], y = a[1], z = a[2];
        var qx = q[0], qy = q[1], qz = q[2], qw = q[3];
        var ix = qw * x + qy * z - qz * y;
        var iy = qw * y + qz * x - qx * z;
        var iz = qw * z + qx * y - qy * x;
        var iw = -qx * x - qy * y - qz * z;
        a[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        a[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        a[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
        return a;
    }

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

    function circle(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        ctx.closePath();
    }

    function fill_circle(ctx, x, y, r, style) {
        circle(ctx, x, y, r);
        if (style) ctx.fillStyle = style;
        ctx.fill();
    }

    function stroke_circle(ctx, x, y, r, style, line_width) {
        circle(ctx, x, y, r);
        if (style) ctx.strokeStyle = style;
        if (line_width) ctx.lineWidth = line_width;
        ctx.stroke();
    }

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

    function get_canvas_context(canvas, w, h) {
        canvas = canvas || document.createElement('canvas');
        if (w) {
            h = h || w;
            canvas.width = w;
            canvas.height = h;
        }
        return canvas.getContext('2d');
    }

    // parse various color forms, returning an array:
    // 'red' -> ['red']
    // 'red transparent' -> ['red', 'transparent']
    // ['fff, 'blue'] -> ['#fff', 'blue']
    function parse_color_value(value) {
        if (_.isString(value)) {
            var bits = value.trim().split(/[\s]+/);
            return _.map(bits, function(bit) {
                if (bit.match(/^[0-9a-f]{3,8}$/i)) {
                    if (bit.length == 8) {
                        return (
                            'rgba(' +
                                parseInt(bit.substr(0,2), 16) + ',' +
                                parseInt(bit.substr(2,2), 16) + ',' +
                                parseInt(bit.substr(4,2), 16) + ',' +
                                (parseInt(bit.substr(6,2), 16)/255) +
                            ')'
                        );
                    } else {
                        // add # for hex strings
                        return '#' + bit;
                    }
                } else {
                    console.log('INSIGHTS: non-hex color:', bit);
                    return bit;
                }
            });
        } else if (_.isArray(value)) {
            return _.flatten(_.map(value, parse_color_value));
        } else {
            // red warns undefined
            return [ '#f00' ];
        }
    }

    // returns style (string or gradient)
    // XXX pass in default?
    // XXX rotate gradient instead?
    // XXX gradient direction?
    function parse_color(ctx, value, dy) {
        if (typeof dy == 'undefined') dy = 960;
        var colors = parse_color_value(value);
        if (colors.length == 1) {
            var c = colors[0];
            return function() { return c };
        } else {
            return function(time, speed) {
                var speed = speed || 50000;
                var frac = time / speed;
                frac -= ~~frac;

                var g = ctx.createLinearGradient(0, 2*dy*(frac - 1), 0, dy + 2*dy*frac);

                // FIXME only 2 stops for now
                g.addColorStop(0/3, colors[1]);
                g.addColorStop(1/3, colors[0]);
                g.addColorStop(2/3, colors[1]);
                g.addColorStop(3/3, colors[0]);

                /*
                for (var i = 0; i < n; ++i) {
                    var u = i/(n - 1);
                    var v = u + frac;
                    v -= ~~v;
                    g.addColorStop(v, colors[i]);
                }
                */

                return g;
            }
        }
    }

    // ellipse polyfill

    // ( from VelocityJS )
    /* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
    /* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
       then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
    var generateSpringRK4 = (function () {
        function springAccelerationForState (state) {
            return (-state.tension * state.x) - (state.friction * state.v);
        }

        function springEvaluateStateWithDerivative (initialState, dt, derivative) {
            var state = {
                x: initialState.x + derivative.dx * dt,
                v: initialState.v + derivative.dv * dt,
                tension: initialState.tension,
                friction: initialState.friction
            };

            return { dx: state.v, dv: springAccelerationForState(state) };
        }

        function springIntegrateState (state, dt) {
            var a = {
                    dx: state.v,
                    dv: springAccelerationForState(state)
                },
                b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
                c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
                d = springEvaluateStateWithDerivative(state, dt, c),
                dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
                dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

            state.x = state.x + dxdt * dt;
            state.v = state.v + dvdt * dt;

            return state;
        }

        return function springRK4Factory (tension, friction, duration) {

            var initState = {
                    x: -1,
                    v: 0,
                    tension: null,
                    friction: null
                },
                path = [0],
                time_lapsed = 0,
                tolerance = 1 / 10000,
                DT = 16 / 1000,
                have_duration, dt, last_state;

            tension = parseFloat(tension) || 500;
            friction = parseFloat(friction) || 20;
            duration = duration || null;

            initState.tension = tension;
            initState.friction = friction;

            have_duration = duration !== null;

            /* Calculate the actual time it takes for this animation to complete with the provided conditions. */
            if (have_duration) {
                /* Run the simulation without a duration. */
                time_lapsed = springRK4Factory(tension, friction);
                /* Compute the adjusted time delta. */
                dt = time_lapsed / duration * DT;
            } else {
                dt = DT;
            }

            while (true) {
                /* Next/step function .*/
                last_state = springIntegrateState(last_state || initState, dt);
                /* Store the position. */
                path.push(1 + last_state.x);
                time_lapsed += 16;
                /* If the change threshold is reached, break. */
                if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
                    break;
                }
            }

            /* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
               computed path and returns a snapshot of the position according to a given percentComplete. */
            return !have_duration ? time_lapsed : function(percentComplete) { return path[ (percentComplete * (path.length - 1)) | 0 ]; };
        };
    }());

    // returns fn(time) -> value
    function animation_curve(options) {
        options = _.defaults(options, {
            from: 0,
            to: 1,
            duration: 1000,
            delay: 0,
            curve: 'linear'
        });

        var curve;
        switch (options.curve) {
            case 'smooth':
                curve = function(x) { return 3*x*x - 2*x*x*x  };
                break;

            case 'power':
                var gamma = options.gamma || 1;
                curve = function(x) { return Math.pow(x, gamma) };
                break;

            case 'spring':
                var tension = options.tension || 1000;
                var friction = options.friction || 50;
                var spring = generateSpringRK4(tension, friction, options.duration);
                curve = function(x) { return spring(x) };
                break;

            default: case 'linear':
                curve = function(x) { return x };
                break;
        }

        return function(time) {
            var u = curve( saturate( (time - options.delay) / options.duration ) );
            return lerp(options.from, options.to, u);
        };
    }

    // graphics functions

    var graphics = {};

    graphics['chart-pie'] = (function() {

        // TODO
        // hoist this, refactor elsewhere, support MPH
        function Value(text) {
            var bits = text.split('/');
            if (bits.length == 2) {
                this.num = parseInt(bits[0]);
                this.den = parseInt(bits[1]);
            } else {
                this.num = parseInt(text);
                this.den = 100;
            }

            this.frac = this.num / this.den;
        }

        Value.prototype.draw = function(ctx, time) {
            var tt = time / 4125;
            var show_percent = !!((~~tt) & 1);
            tt -= ~~tt;
            tt *= 4125;

            var tickup = smoothstep( Math.min(1, tt/500) );
            var fadeon = Math.min(1, tt/300);
            if (tt > 3500) {
                fadeon = Math.max(0, 1 - (tt - 3500)/500);
            }

            ctx.font = '700 123px helvneue';
            ctx.textAlign = 'center';

            ctx.globalAlpha = fadeon;

            if (show_percent) {
                var text = Math.round(100 * this.frac * tickup) + '%';
                ctx.fillText(text, 0, 38);
            } else {
                ctx.fillRect(-100, -3, 200, 6);
                var text = ~~(this.num * tickup) + '';
                ctx.fillText(text, 0, -40);
                var text = this.den + '';
                ctx.fillText(text, 0, 130);
            }

            ctx.globalAlpha = 1.0;
        };

        var cw = 960, ch = 960;

        var radius = 500;
        function fill_arc(ctx, frac, color) {
            var theta = TWO_PI * (0.25 + frac);
            ctx.beginPath();
            ctx.moveTo(0, 200);
            ctx.lineTo(0, 500);
            ctx.arc(0, 0, 500, 0.5*Math.PI, theta, false);
            ctx.lineTo(200 * Math.cos(theta), 200 * Math.sin(theta));
            ctx.arc(0, 0, 200, theta, 0.5*Math.PI, true);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        return function init_pies(ctx, data) {
            var pies = [];
            var n_pies = data.length;

            var tx, ty, scale;
            if (n_pies == 2) {
                ty = ch/2 + 65;
                scale = 180/500;
            } else {
                ty = ch/2 + 20;
                scale = 230/500;
            }

            _.each(data, function(data, index) {
                if (n_pies == 2) {
                    tx = (index == 0) ? 0.27*cw : (1-0.27)*cw;
                } else {
                    tx = cw/2;
                }

                pies.push({
                    value: new Value(data.value),
                    anim2: animation_curve({
                        duration: 800,
                        delay: 400*index + 333,
                        curve: 'smooth'
                    }),
                    anim: animation_curve({
                        duration: 800,
                        delay: 400*index,
                        curve: 'spring',
                        tension: 300,
                        friction: 30
                    }),
                    colors: {
                        hole: parse_color(ctx, data.colors.hole),
                        back: parse_color(ctx, data.colors.back),
                        fore: parse_color(ctx, data.colors.fore),
                        text: parse_color(ctx, data.colors.text)
                    },
                    transform: [tx, ty, scale]
                });
            });

            return function(ctx, time, hold) {
                _.each(pies, function(pie) {
                    ctx.save();
                    ctx.translate(pie.transform[0], pie.transform[1]);
                    ctx.scale(pie.transform[2], pie.transform[2]);

                    var tt = pie.anim(time);

                    var tt2 = pie.anim2(time);
                    var vv = pie.value.frac * tt2;

                    // pie
                    ctx.save();
                    ctx.scale(tt, tt);
                    fill_arc(ctx, 1, pie.colors.back(time));
                    ctx.restore();

                    fill_arc(ctx, vv, pie.colors.fore(time));
                    fill_circle(ctx, 0, 0, 200, pie.colors.hole(time));

                    // text
                    if (time > 0) {
                        ctx.fillStyle = pie.colors.text(time);
                        pie.value.draw(ctx, time);
                    }

                    ctx.restore();
                });
            }
        }

    }());

    graphics['chart-bar'] = (function() {

        return function init_bars(ctx, data) {
            var bars = [];
            var max_value = 0;
            _.each(data, function(data, index) {
                var value = parseInt(data.value);
                max_value = Math.max(max_value, value);
                bars.push({
                    value: value,
                    label: data.label ? data.label.toUpperCase() : null,
                    time_offset: index * 0.3,
                    colors: {
                        tail: parse_color(ctx, data.colors.tail),
                        head: parse_color(ctx, data.colors.head),
                        text: parse_color(ctx, data.colors.text),
                        label: parse_color(ctx, data.colors.label)
                    }
                });
            });

            return function(ctx, time) {
                ctx.save();
                ctx.translate(0, 530);

                // current bar y pos
                var n_bars = bars.length;
                var radius = 80 - 10*(n_bars - 1);
                var font_size = 100 - n_bars*16;

                var spacing = 80;
                var bar_height = 2*radius;
                var total_height = n_bars*bar_height + (n_bars-1)*spacing;
                var cy = -total_height/2 + radius;
                var ch = 2*radius + spacing;

                for (var i = 0; i < n_bars; ++i) {
                    var bar = bars[i];

                    var tt = clamp(time/800 - bar.time_offset, 0, 1);
                    tt = smoothstep(tt);
                    var vv = bar.value * tt;
                    var frac = tt*bar.value/max_value;

                    var x0 = 50 + radius;;
                    var x1 = x0 + frac * (960 - 100 - 2*radius);

                    // label
                    if (bar.label) {
                        ctx.font = '300 33px lubalin';
                        ctx.textAlign = 'left';
                        ctx.fillStyle = bar.colors.label(time);
                        ctx.globalAlpha = tt;
                        ctx.fillText(bar.label, x0 - radius, cy - radius - 15);
                        ctx.globalAlpha = 1;
                    }

                    // tail
                    ctx.fillStyle = bar.colors.tail(time);
                    ctx.fillRect(x0, cy - radius, x1-x0, 2*radius);
                    fill_circle(ctx, x0, cy, radius);

                    // head
                    ctx.fillStyle = bar.colors.head(time);
                    fill_circle(ctx, x1, cy, radius);

                    // text
                    ctx.fillStyle = bar.colors.text(time);
                    ctx.font = '700 '+font_size+'px helvneue';
                    ctx.textAlign = 'center';

                    var text = ~~vv;
                    ctx.fillText(text, x1, cy + font_size/3);

                    cy += ch;
                }

                ctx.restore();
            }
        }

    }());

    graphics['chart-line'] = (function() {

        return function init_lines(ctx, data) {
            // graph -> canvas
            var M = {
                sx: 1, sy: 1,
                tx: 0, ty: 0
            };

            // get min/max value
            function get_range(values) {
                var min = Infinity, max = -min;
                values.forEach(function(v) {
                    min = Math.min(min, v);
                    max = Math.max(max, v);
                });
                return [min, max];
            }

            // axes / graph coords calculation
            
            var xvalues = data.axes.x.values;
            var xrange = get_range(xvalues);
            xrange[0] -= 0.5;
            xrange[1] += 0.5;

            var yvalues = data.axes.y.values;
            var yrange = get_range(yvalues);
            yrange[0] -= 0.35;
            yrange[1] += 0.35;

            var cw = 960;
            var ch = 960;
            var graph_w = 0.790 * cw;
            var graph_h = 0.400 * ch;

            M.sx = graph_w / (xrange[1] - xrange[0]);
            M.sy = -graph_h / (yrange[1] - yrange[0]);
            M.tx = -xrange[0];
            M.ty = -yrange[1];

            var series = [];
            _.each(data.data, function(data) {
                var points = [];
                var v = [0, 0];
                for (var i = 0; i < data.points.length; i += 2) {
                    points.push(
                        (data.points[i + 0] + M.tx) * M.sx,
                        (data.points[i + 1] + M.ty) * M.sy);
                }

                series.push({
                    color: parse_color(ctx, data.color),
                    points: points
                });
            });

            return function(ctx, time) {
                ctx.save();
                ctx.translate(40 + (cw - graph_w)/2, ch - graph_h - 270);

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 12;

                // axes
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, graph_h);
                ctx.lineTo(graph_w, graph_h);
                ctx.stroke();

                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';

                // y axis
                ctx.font = '700 60px helvneue';
                for (var i = 0; i < yvalues.length; ++i) {
                    var y = yvalues[i];
                    var tx = -65;
                    var ty = (y + M.ty) * M.sy;
                    var text = ''+y;
                    ctx.fillText(text, tx, ty + 20);
                }

                // x axis
                ctx.font = '700 60px helvneue';
                ctx.globalAlpha = 0.5;
                for (var i = 0; i < xvalues.length; ++i) {
                    var x = xvalues[i];
                    var ty = graph_h + 70;
                    var tx = (x + M.tx) * M.sx;
                    var text = ''+x;
                    ctx.fillText(text, tx, ty);
                }
                ctx.font = '300 30px lubalin';
                ctx.fillText('Set', 13, graph_h + 68);
                ctx.globalAlpha = 1.0;
                ctx.lineCap = 'round';

                _.each(series, function(data, index) {
                    var time_offset = index * 0.3;
                    var tt = clamp(time/2000 - time_offset, 0, 1);
                    tt = smoothstep(tt);
                    var n_points = data.points.length/2;
                    var n_pointsf = tt * n_points;

                    ctx.strokeStyle = data.color(time);
                    ctx.beginPath();
                    for (var i = 0; i < n_pointsf+1; ++i) {
                        var x = data.points[2*i + 0];
                        var y = data.points[2*i + 1];

                        if (i == 0) {
                            ctx.moveTo(x, y);
                        } else if (i < n_pointsf) {
                            ctx.lineTo(x, y);
                        } else if (i < (n_pointsf + 1)) {
                            var frac = i - n_pointsf;
                            var x0 = data.points[2*i - 2];
                            var y0 = data.points[2*i - 1];

                            x = lerp(x, x0, frac);
                            y = lerp(y, y0, frac);

                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.stroke();
                });

                ctx.restore();
            }
        }

    }());

    graphics['icon-court'] = (function() {

        return function init_icon_court(ctx, data) {

            var colors = {
                floor: parse_color(ctx, data.colors.floor),
                lines: parse_color(ctx, data.colors.lines),
                ball: parse_color(ctx, data.colors.ball),
                text: parse_color(ctx, data.colors.text)
            };

            // make lines "transparent":
            colors.lines = background_color;

            var value = parseInt(data.value);

            // ball dynamics
            var bx = 300;
            var by = 30;
            var bhist_len = 10;
            var bhist = new Float32Array(2*bhist_len);
            var bdx = 0;
            var bdy = 0;
            var next_hit_time = 0;
            var bripple = 0;
            var bripple_x = 0;
            var bripple_y = 0;
            var btime = 0;

            var bripple_style = 'fill';
            //key('1', function() { bripple_style = 'fill' });
            //key('2', function() { bripple_style = 'stroke' });
            var mblur = true;
            //key('m', function() { mblur = !mblur });

            // http://www.ncbi.nlm.nih.gov/pmc/articles/PMC2653872/
            function update_ball() {
                bx += bdx;
                by += bdy;

                for (var i = 0; i < bhist_len - 2; i += 2) {
                    bhist[i + 0] = bhist[i + 2];
                    bhist[i + 1] = bhist[i + 3];
                }
                bhist[bhist_len-2] = bx;
                bhist[bhist_len-1] = by;

                bdx *= 0.970;
                bdy *= 0.970;

                btime += 1/60;
                bripple = Math.min(1, bripple + 0.10);

                if (btime < next_hit_time) return;

                bripple = 0;
                bripple_x = bx;
                bripple_y = by;

                var duration = 0.5*random_uniform(0.9, 1.2);
                next_hit_time = btime + duration;

                var next_bx = random_distribute(500, 700, 3);
                var next_by = random_uniform(-350/2, 350/2);

                if (bx > 0) next_bx = -next_bx;

                bdx = (next_bx - bx) / (60*duration);
                bdy = (next_by - by) / (60*duration);
            }

            function draw_court(time) {
                var w = 842;
                var h = 410;

                // court background
                ctx.fillStyle = colors.floor(time);
                ctx.fillRect(-w/2, -h/2, w, h);

                // doubles border
                ctx.lineWidth = 5;
                var b = 20;
                var b = 0;
                ctx.strokeStyle = colors.lines(time);
                ctx.strokeRect(-w/2+b, b-h/2, w-2*b, h-2*b);

                ctx.beginPath();

                // singles border
                var c = 66;
                ctx.moveTo(b-w/2, c-h/2);
                ctx.lineTo(w/2-b, c-h/2);
                ctx.moveTo(b-w/2, h/2-c);
                ctx.lineTo(w/2-b, h/2-c);

                // center line
                ctx.moveTo(0, b-h/2);
                ctx.lineTo(0, h/2-b);

                // H
                var x = 215;
                ctx.moveTo(-x, c-h/2);
                ctx.lineTo(-x, h/2-c);

                ctx.moveTo(x, c-h/2);
                ctx.lineTo(x, h/2-c);

                ctx.moveTo(-x, 0);
                ctx.lineTo(x, 0);

                ctx.stroke();
            }

            function draw_ball(time) {
                var r = 5;
                ctx.fillStyle = colors.ball(time);

                if (mblur) {
                    for (var i = 0; i < bhist_len; i += 2) {
                        var x = bhist[i + 0];
                        var y = bhist[i + 1];
                        ctx.beginPath();
                        ctx.arc(x, y, r, 0, 2*Math.PI);
                        ctx.closePath();

                        var u = i / (bhist_len - 2);
                        var alpha = lerp(0.1, 1.0, u);
                        ctx.globalAlpha = alpha;
                        ctx.fill();
                    }
                } else {
                    ctx.beginPath();
                    ctx.arc(bx, by, r, 0, 2*Math.PI);
                    ctx.closePath();
                    ctx.globalAlpha = 1;
                    ctx.fill();
                }

                // ripple
                ctx.beginPath();
                ctx.arc(bripple_x, bripple_y, r + 10*bripple, 0, 2*Math.PI);
                ctx.closePath();
                ctx.lineWidth = 2;
                ctx.globalAlpha = Math.pow(1-bripple, 1);

                if (bripple_style == 'fill')
                    ctx.fill();
                else
                    ctx.stroke();

                ctx.globalAlpha = 1;
            }

            return function(ctx, time) {
                var cw = 960;
                var ch = 960;

                ctx.save();
                //ctx.translate(cw/2 + 10, ch/2 - 10);
                ctx.translate(cw/2, ch/2);
                draw_court(time);
                update_ball();
                draw_ball(time);

                // text
                ctx.font = '700 250px helvneue';
                ctx.textAlign = 'center';
                ctx.fillStyle = colors.text(time);

                var tt = Math.min(1, time/1000);
                var N = ~~lerp(0, value, Math.pow(tt, 0.25));
                ctx.fillText(''+N, 0, 90);

                ctx.restore();
            };

        };

    }());

    graphics['icon-ball'] = (function() {

        // http://www.darenscotwilson.com/spec/bbseam/bbseam.html
        function calc_tennis_ball() {
            var n = 128;
            var lines = new Float32Array(3 * (n+1));
            var P = vec3_create();
            var sin = Math.sin, cos = Math.cos, PI = Math.PI;
            var B = 0.50;
            var F = 1.0;
            var dp = 0;
            for (var i = 0; i < n; ++i) {
                var t = 2*PI*i/n;
                P[0] = cos(t) - B*cos(3*t);
                P[1] = sin(t) + B*sin(3*t);
                P[2] = F*cos(2*t);
                vec3_normalize(P);

                lines[dp++] = P[0];
                lines[dp++] = P[1];
                lines[dp++] = P[2];
            }
            // repeat first point
            lines[dp++] = lines[0];
            lines[dp++] = lines[1];
            lines[dp++] = lines[2];
            return lines;
        }

        // 3d curve points
        var points = calc_tennis_ball();

        return function init_icon_ball(ctx, data) {

            // rotation magic
            var Q = quat_create();
            var A = vec3_random_unit(vec3_create());
            var T = TWO_PI * Math.random();
            var S = 0.3;
            var Q0 = quat_create();
            var P = vec3_create();
            quat_rotate_z(Q0, 0.5*Math.PI);

            var colors = {
                felt: parse_color(ctx, data.colors.felt, 1),
                line: parse_color(ctx, data.colors.line, 2),
                border: parse_color(ctx, data.colors.border, 2),
                text: parse_color(ctx, data.colors.text)
            };

            var value = parseInt(data.value);
            var cw = 960, ch = 960;

            var anim_scale = animation_curve({ from: 0, to: 250, duration: 500, curve: 'spring' });

            return function(ctx, time) {
                ctx.save();
                ctx.translate(cw/2, ch/2);

                ctx.save();

                var scale = anim_scale(time);
                ctx.scale(scale, scale);

                // felt?
                ctx.fillStyle = colors.felt(time);
                circle(ctx, 0, 0, 1);
                ctx.fill();

                // line
                T += S;
                S *= 0.98;
                quat_axis_angle(Q, A, T);

                var tt = Math.min(1, time/2000);
                quat_lerp(Q, Q0, smoothstep( tt ));
                quat_normalize(Q);

                ctx.beginPath();
                var ink = false;
                for (var i = 0; i < points.length; i += 3) {
                    P[0] = points[i + 0];
                    P[1] = points[i + 1];
                    P[2] = points[i + 2];
                    vec3_transform_quat(P, Q);

                    var x = P[0];
                    var y = P[1];
                    var z = P[2];

                    if (z > 0) {
                        if (!ink) {
                            ctx.moveTo(x, y);
                            ink = true;
                        } else
                            ctx.lineTo(x, y);
                    } else {
                        ink = false;
                    }
                }

                ctx.lineWidth = 40/400;
                ctx.strokeStyle = colors.line(time);
                ctx.stroke();

                // border
                ctx.strokeStyle = colors.border(time);
                ctx.lineWidth = 40/400;
                circle(ctx, 0, 0, 1);
                ctx.stroke();

                // text
                scale = 1/250;
                ctx.scale(scale, scale);
                ctx.font = '700 245px helvneue';
                ctx.textAlign = 'center';
                ctx.fillStyle = colors.text(time);

                var N = ~~lerp(0, value, Math.pow(tt, 0.3));
                ctx.fillText(''+N, 0, 90);

                ctx.restore(); // restore scale
                ctx.restore(); // restore translate
            }

        };

    }());

    graphics['icon-net'] = (function() {

        return function init_icon_net(ctx, data) {

            var colors = {
                posts: parse_color(ctx, data.colors.posts),
                border: parse_color(ctx, data.colors.border),
                lines: parse_color(ctx, data.colors.lines),
                fabric: parse_color(ctx, data.colors.fabric),
                text: parse_color(ctx, data.colors.text)
            };

            // make lines "transparent":
            colors.lines = background_color;

            var value = parseInt(data.value);
            var cw = 960, ch = 960;

            return function(ctx, time) {
                ctx.save();
                ctx.translate(cw/2, ch/2 - 20);

                // post width
                var tt = Math.min(1, time/500);
                tt = smoothstep(tt);
                var w = lerp(0, 410, tt);

                // bounce
                var ttt = Math.pow(Math.min(1, time/1500), 0.5);
                var B = (1-ttt)*250*Math.sin(8*Math.pow(0.002*time, 1.5));

                // net
                ctx.beginPath();
                ctx.moveTo(-w, -16);
                ctx.bezierCurveTo(-0.5*w, -16+B, 0.5*w, -16+B, w, -16);
                ctx.lineTo(w, 180);
                ctx.bezierCurveTo(0.5*w, 180+B, -0.5*w, 180+B, -w, 180);
                ctx.closePath();
                ctx.fillStyle = colors.fabric(time);
                ctx.fill();

                // net lines
                ctx.save();
                ctx.clip();
                ctx.beginPath();
                for (var i = 0; i < 3; ++i) {
                    var y = lerp(-16, 180, (i+1)/4);
                    ctx.moveTo(-w, y);
                    ctx.bezierCurveTo(-0.5*w, y+B, 0.5*w, y+B, w, y);
                }

                for (var i = 0; i < 15; ++i) {
                    var x = lerp(-w, w, (i+1)/16);
                    ctx.moveTo(x, -100);
                    ctx.lineTo(x, 280);
                }
                ctx.strokeStyle = colors.lines(time);
                ctx.lineWidth = 6;
                ctx.stroke();
                ctx.restore();

                // net border
                ctx.beginPath();
                ctx.moveTo(-w, -16);
                ctx.bezierCurveTo(-0.5*w, -16+B, 0.5*w, -16+B, w, -16);
                ctx.moveTo(w, 180);
                ctx.bezierCurveTo(0.5*w, 180+B, -0.5*w, 180+B, -w, 180);
                ctx.strokeStyle = colors.border(time);
                ctx.lineWidth = 26;
                ctx.stroke();

                // posts
                var bw = 40;
                ctx.fillStyle = colors.posts(time);
                ctx.fillRect(-w-bw/2, -45, bw, 300);
                ctx.fillRect(w-bw/2, -45, bw, 300);

                // text
                var Q = 600;
                if (time > Q) {
                    ctx.font = '700 255px helvneue';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = colors.text(time);
                    var tt = Math.min(1, (time-Q)/1000);
                    var N = ~~lerp(0, value, Math.pow(tt, 0.25));
                    ctx.fillText(''+N, 0, 115);
                }

                ctx.restore();
            }
        };

    }());

    graphics['icon-racket'] = (function() {

        var spring = generateSpringRK4(500, 20, 1000);

        return function init_icon_racket(ctx, data) {

            var colors = {
                handle: parse_color(ctx, data.colors.handle),
                frame: parse_color(ctx, data.colors.frame),
                text: parse_color(ctx, data.colors.text)
            };

            var value = parseInt(data.value);
            var cw = 960, ch = 960;

            return function(ctx, time) {
                ctx.save();
                ctx.translate(0.90*cw, 0.625*ch);

                var frac = Math.min(1, time/1000);
                var theta = RAD_PER_DEG * lerp( 175, -45, spring(frac));

                frac = Math.min(1, time/750);
                frac = smoothstep(frac); //Math.pow(frac, 0.25);
                var phi = lerp(RAD_PER_DEG * 720, 0, frac);
                var sx = Math.abs(Math.cos(phi));;

                ctx.translate(0, 325);
                ctx.rotate(theta);
                ctx.scale(1.9, 1.9);    // SCALE
                ctx.translate(0, -325);

                // frame
                ctx.beginPath();
                ctx.ellipse(0, 0, sx*98, 106, 0, TWO_PI, false);
                ctx.moveTo(0, 190);
                ctx.bezierCurveTo(0, 150, sx*-10, 120, sx*-65, 80);
                ctx.moveTo(0, 190);
                ctx.bezierCurveTo(0, 150, sx*10, 120, sx*65, 80);
                ctx.strokeStyle = colors.frame(time);
                ctx.lineWidth = 25;
                ctx.stroke();

                // handle
                ctx.beginPath();
                ctx.moveTo(0, 182);
                ctx.lineTo(0, 325);
                ctx.lineWidth = 29;
                ctx.strokeStyle = colors.handle(time);
                ctx.stroke();

                // text
                if (time > 0) {
                    // XXX 3 digit values, use smaller font size
                    ctx.font = '700 130px helvneue';
                    ctx.textAlign = 'center';
                    ctx.fillStyle = colors.text(time);
                    var tt = Math.min(1, time/1000);
                    var N = ~~lerp(0, value, Math.pow(tt, 0.25));
                    ctx.rotate(RAD_PER_DEG*45);
                    ctx.fillText(''+N, 0, 43);
                }

                ctx.restore();
            }
        };

    }());

    graphics['icon-text'] = (function() {

        return function init_icon_text(ctx, data) {

            var colors = {
                text: parse_color(ctx, data.colors.text, 200)    // YY
            };

            var value = parseInt(data.value);
            var cw = 960, ch = 960;

            return function(ctx, time) {
                ctx.save();
                ctx.translate(cw/2, ch/2);

                ctx.font = '700 500px helvneue';
                ctx.textAlign = 'center';
                ctx.fillStyle = colors.text(time);

                var tt = Math.min(1, time/1000);
                var N = ~~lerp(0, value, Math.pow(tt, 0.25));
                ctx.fillText(''+N, 0, 180);

                ctx.restore();
            }
        };

    }());

    graphics['scorecard'] = (function() {

        return function init_scorecard(ctx, data) {
            
            var num_columns = data.length;
            var max_columns = 5;
            var num_rows = data.rows.length;
            console.assert(num_rows == 2);

            function get_values(data) {
                var values = [];
                for (var i = 0; i < num_columns; ++i) {
                    v = data[i];
                    if (typeof v == 'undefined')
                        values.push(-1);
                    else
                        values.push(v);
                }
                return values;
            }

            var rows = [];
            _.each(data.rows, function(data) {

                rows.push({
                    values: get_values(data.values),
                    colors: {
                        back: parse_color(ctx, data.colors.back),
                        text: parse_color(ctx, data.colors.text)
                    },
                    checked: !!data.checked
                });

            });

            var spring = generateSpringRK4(100, 15, 500);

            var spring2 = generateSpringRK4(200, 13, 1000);
            function animcurve(time, offset, duration, curve) {
                var t = clamp((time - offset) / duration, 0, 1);
                return curve ? curve(t) : t;
            }

            return function(ctx, time, hold) {
                var cw = 960;
                var ch = 960;

                ctx.save();
                ctx.translate(50, ch/2);

                ctx.textAlign = 'center';
                ctx.font = '700 55px helvneue';

                _.each(rows, function(row, index) {
                    var ty = -40 + index * 165;

                    for (var i = 0; i < num_columns; ++i) {
                        var tx = 65 + 160 * i;

                        ctx.save();

                        //var scale = 1.30;
                        var delay = (i * 80) + (index * 300);
                        var scale = lerp(0, 1.30, animcurve(time, delay, 1000, spring2));

                        ctx.translate(tx, ty);
                        ctx.scale(scale, scale);

                        ctx.fillStyle = row.colors.back(time);
                        ctx.fillRect(-50, -50, 100, 100);

                        var value = row.values[i];
                        delay += 250;
                        //delay += 300 + (50 * i);
                        if (value >= 0 && time >= delay) {
                            time = hold || time;
                            var vv = saturate((time - delay) / 500);
                            vv = Math.pow(vv, 0.3);
                            value = ~~(value * vv);
                            ctx.fillStyle = row.colors.text(time);
                            ctx.fillText(''+value, 0, 20);
                        }

                        ctx.restore();
                    }

                    if (row.checked) {
                        var scale = lerp(0, 0.25, animcurve(time, 2000, 500, spring));
                        //var scale = 0.25;

                        ctx.save();
                        ctx.translate(tx + 115, ty);
                        ctx.scale(scale, scale);

                        ctx.beginPath();
                        ctx.arc(0, 0, 100, 0, TWO_PI);
                        ctx.closePath();
                        ctx.fillStyle = row.colors.back(time);
                        ctx.fill();

                        ctx.strokeStyle = row.colors.text(time);
                        ctx.lineWidth = 23;
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        ctx.beginPath();
                        ctx.moveTo(-35, 13);
                        ctx.lineTo(-5, 37);
                        ctx.lineTo(35, -40);
                        ctx.stroke();

                        ctx.restore();
                    }
                });

                ctx.restore();
            };

        };

    }());

    // XXX messy
    var background_color;

    function init_tile3(ctx_, data)
    {
        var ctx = ctx_;
        //var background_color = parse_color(ctx, data.background.color);
        background_color = parse_color(ctx, data.background.color);
        var title_color_text = parse_color(ctx, data.title.colors.text);
        var title_color_underline = parse_color(ctx, data.title.colors.underline);
        var subtitle_color = parse_color(ctx, data.subtitle.color);
        var player_colors = _.map(data.players, function(player) { return parse_color(ctx, player.color) });

        var draw_graphic = function(ctx, time) {};
        var cw = 960, ch = 960;

        var factory = graphics[data.graphic.type];
        var draw_graphic = factory(ctx, data.graphic.data);
        var use_reverse = (data.graphic.type != 'icon-court');

        var draw_scorecard = data.scorecard ? graphics['scorecard'](ctx, data.scorecard) : null;

        var spring = generateSpringRK4(100, 15, 500);
        function animcurve(time, offset, duration, curve) {
            var t = clamp((time - offset) / duration, 0, 1);
            return curve ? curve(t) : t;
        }

        function draw(options) {
            var time = options.time;
            var background_only = options.background_only;

            ctx.save();

            var csize = Math.min(ctx.canvas.width, ctx.canvas.height);
            var cscale = csize/960;
            if (cscale !== 1) ctx.scale(cscale, cscale);

            // background
            ctx.fillStyle = background_color(time);
            ctx.fillRect(0, 0, cw, ch);

            if (background_only) {
                ctx.restore();
                return;
            }

            // title
            ctx.font = '600 62px lubalin';
            ctx.fillStyle = title_color_text(time);
            var text = data.title.text.toUpperCase();
            var frac = clamp(time/500, 0, 1);
            ctx.globalAlpha = frac;
            ctx.fillText(text, 50, 90);
            ctx.globalAlpha = 1;

            // title.underline
            var frac = clamp(time/300, 0, 1);
            frac = Math.pow(frac, 3);
            ctx.fillStyle = title_color_underline(time);
            ctx.fillRect(50, 104, frac*(cw-100), 5);

            // subtitle
            ctx.font = '300 32px lubalin';
            ctx.fillStyle = subtitle_color(time);
            ctx.save();
            ctx.textAlign = 'center';

            ctx.globalAlpha = animcurve(time, 1500, 1000);
            ctx.fillText(data.subtitle.text, cw/2, ch-100);
            ctx.restore();

            // players
            _.each(data.players, function(player, index) {
                var ty = 180 + index * 72;
                var tx = lerp(cw, 50, animcurve(time, 200*(index+1), 500, spring));

                ctx.fillStyle = player_colors[index](time);

                ctx.font = '700 60px helvneue';
                ctx.fillText(player.name, tx, ty);
                var tw = ctx.measureText(player.name).width;
                tx += tw + 20;

                ctx.font = '200 45px helvneue';
                ctx.fillText('('+player.code+')', tx, ty);

                var tw = ctx.measureText(player.code).width;
                tx += tw + 70;

                if (player.checked) {
                    var scale = lerp(0, 0.25, animcurve(time, 2000, 500, spring));

                    ctx.save();
                    ctx.translate(tx, ty - 15);
                    //ctx.scale(0.25, 0.25);
                    ctx.scale(scale, scale);

                    ctx.beginPath();
                    ctx.arc(0, 0, 100, 0, TWO_PI);
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 23;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(-35, 13);
                    ctx.lineTo(-5, 37);
                    ctx.lineTo(35, -40);
                    ctx.stroke();

                    ctx.restore();
                }
            });

            var gtime = time - 700;
            if (gtime > 0) {

                if (draw_scorecard) {
                    // give me int/frac of time/3000
                    var duration = 6000;

                    var f = gtime/duration;
                    var period = ~~f;
                    gtime = (f - period) * duration;

                    var tx = 0;
                    if (gtime > 5500) {
                        var u = (gtime - 5500)/500;
                        tx = -Math.pow(u, 2) * 1000;
                    }

                    if (tx) {
                        ctx.save();
                        ctx.translate(tx, 0);
                    }

                    if (period & 1) {
                        //if (gtime > 3000) gtime = 5750 -gtime;
                        draw_scorecard(ctx, gtime);

                    } else {
                        draw_graphic(ctx, gtime);
                    }

                    if (tx) {
                        ctx.restore();
                    }

                } else {

                    // XXX don't bother with court
                    if (use_reverse) {
                        var duration = 9000;
                        gtime = gtime/duration;
                        gtime = (gtime - ~~gtime) * duration;

                        if (gtime > 8500) {
                            // don't draw
                            gtime = -1;
                        } else if (gtime > 8000) {
                            gtime = Math.max(0, 2.0*(8500 - gtime));
                        }
                    }

                    if (gtime >= 0)
                        draw_graphic(ctx, gtime);

                }
            }

            // temp rulers to help with alignment
            if (0) {
                ctx.fillStyle = '#fff';
                ctx.fillRect(50, 0, 1, ch);
                ctx.fillRect(910, 0, 1, ch);

                ctx.fillStyle = '#f00';
                ctx.fillRect(0, 392, cw, 1);
                ctx.fillRect(0, 572, cw, 1);
            }

            ctx.restore();
        }

        return {
            id: data.id,
            data: data,
            draw: draw
        };
    }

    function resize_canvas(canvas, ratio) {
        var size = ~~(ratio * Math.min(canvas.clientWidth, canvas.clientHeight));
        if (canvas.width !== size) canvas.width = size;
        if (canvas.height !== size) canvas.height = size;
        return size;
    }

    // this init function takes the data and returns the drawing function for that tile
    // so we can patch in other graphics here!
    function init(ctx, data) {
        console.assert(data.graphic);
        return init_tile3(ctx, data).draw;
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

        return function(data, canvas) {
            if (!data || !canvas) {
                // stop animation
                ctx = null;
                redraw = null;
                return;
            }

            var startup = !ctx;

            ctx = canvas.getContext('2d');
            ratio = get_canvas_pixel_ratio(ctx);

            redraw = init(ctx, data);
            start_time = 0;

            if (startup)
                animation_callback(0);
        };

    }());

    // clock time of preview frame
    var preview_time = 5000;

    // queue of preview tasks due to unloaded fonts
    var previews_todo = [];
    function do_previews() {
        previews_todo.forEach(function(o) {
            var ctx = o.canvas.getContext('2d');
            init(ctx, o.data)({ time: preview_time });
        });
        previews_todo = null;
    }

    return {
        is_supported: true,

        shareable: function(data) {
            var tile = (function() {
                var ctx = get_canvas_context(null, 600);
                init(ctx, data)({ time: preview_time });
                return ctx.canvas;
            }());

            var ctx = get_canvas_context(null, 1200, 600);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 1200, 600);
            ctx.drawImage(tile, 300, 0);
            return ctx.canvas;
        },

        shareable_base64: function(data) {
            var image = this.shareable(data);
            var data_url = image.toDataURL('png');
            var m = data_url.match(/^data:(.*?);base64,/);
            return data_url.substr(m[0].length);
        },

        preview: function(data, arg) {
            var canvas;
            var csize;

            //if (arg instanceof HTMLCanvasElement) {
            if (arg.width && arg.height) {
                canvas = arg;
                csize = Math.min(canvas.width, canvas.height);
            } else {
                csize = arg;    // must be number
                canvas = document.createElement('canvas');
                canvas.width = canvas.height = csize;
            }

            var ctx = canvas.getContext('2d');

            var ratio = get_canvas_pixel_ratio(ctx);
            canvas.width = canvas.height = ~~(ratio * csize);

            var preview_time = 5000;
            init(ctx, data)({
                time: preview_time,
                background_only: !!previews_todo
            });

            canvas.style.width = csize+'px';
            canvas.style.height = csize+'px';

            if (previews_todo) {
                previews_todo.push({
                    canvas: canvas,
                    data: data
                });
            }

            return canvas;
        },

        preview_base64: function(data, size) {
            console.assert(!previews_todo, 'fonts not loaded');

            var canvas = this.preview(data, size);
            var data_url = canvas.toDataURL('png');
            var m = data_url.match(/^data:(.*?);base64,/);
            console.assert(m);
            return data_url.substr(m[0].length);
        },

        play: function(data, canvas) {
            if (!canvas)
                canvas = document.createElement('canvas');
            animate(data, canvas);
            return canvas;
        },

        stop: function() {
            animate(null);
        },

        fonts_loaded: function() {
            do_previews();
        },

        load_fonts: function(callback) {
            WebFont.load({
                custom: {
                    families: [ 'lubalin:n3,n6', 'helvneue:n2,n7' ],
                    urls: [ 'css/fonts.css' ]
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
