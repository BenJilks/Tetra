/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var Window = /** @class */ (function () {
    function Window(canvas) {
        var _this = this;
        this.canvas = canvas;
        this.gc = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.key_buffer = [];
        this.keys_down = [];
        window.addEventListener('resize', function () { _this.do_resize(); });
        window.requestAnimationFrame(function () { _this.do_render(); });
        window.addEventListener('keydown', function (e) {
            if (!_this.keys_down.includes(e.keyCode))
                _this.keys_down.push(e.keyCode);
            _this.key_buffer.push(e.keyCode);
        }, true);
        window.addEventListener('keyup', function (e) {
            var index = _this.keys_down.indexOf(e.keyCode);
            if (index > -1)
                _this.keys_down.splice(index, 1);
        }, true);
        this.do_resize();
    }
    Window.prototype.is_key_down = function (key_code) {
        return this.keys_down.includes(key_code);
    };
    Window.prototype.do_render = function () {
        var _this = this;
        this.gc.fillStyle = '#FFF';
        this.gc.fillRect(0, 0, this.width, this.height);
        this.render();
        for (var i = 0; i < this.key_buffer.length; i++)
            this.key_pressed(this.key_buffer[i]);
        this.key_buffer = [];
        this.update();
        window.requestAnimationFrame(function () { _this.do_render(); });
    };
    Window.prototype.do_resize = function () {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.resize();
        this.do_render();
    };
    return Window;
}());

var Color = /** @class */ (function () {
    function Color(r, g, b) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = 1;
    }
    Color.copy = function (other) {
        var color = new Color(other.r, other.g, other.b);
        color.a = other.a;
        return color;
    };
    Color.prototype.make_css = function () {
        return "rgba(" +
            this.r + ", " +
            this.g + ", " +
            this.b + ", " +
            this.a + ")";
    };
    return Color;
}());
var config = {
    margin: 50,
    block_row_count: 20,
    block_column_count: 10,
    preview_stack_size: 5,
    pallet: [
        new Color(140.1, 219.5, 114.9),
        new Color(243.5, 57.2, 57.2),
        new Color(118.0, 96.4, 234.3),
        new Color(102.6, 189.7, 224.7),
        new Color(234.3, 234.3, 107.9),
        new Color(252.0, 138.9, 213.7),
        new Color(255, 255, 255) // White
    ]
};

var Shape = /** @class */ (function () {
    function Shape(width, height, data) {
        this.width = width;
        this.height = height;
        this.data = new Int32Array(width * height);
        for (var i = 0; i < data.length; i++)
            this.data[i] = data[i];
    }
    Shape.prototype.get_width = function () { return this.width; };
    Shape.prototype.get_height = function () { return this.height; };
    Shape.prototype.get_block = function (x, y) {
        return this.data[y * this.width + x];
    };
    Shape.prototype.draw = function (pos_x, pos_y, draw_block, is_preview) {
        if (is_preview === void 0) { is_preview = false; }
        for (var y = 0; y < this.height; y += 1) {
            for (var x = 0; x < this.width; x += 1) {
                var block_id = this.get_block(x, y);
                if (block_id)
                    draw_block(pos_x + x, pos_y + y, block_id, is_preview);
            }
        }
    };
    Shape.prototype.does_collide = function (pos_x, pos_y, blocks) {
        for (var y = 0; y < config.block_row_count; y += 1) {
            for (var x = 0; x < config.block_column_count; x += 1) {
                if (x >= pos_x && x < pos_x + this.width &&
                    y >= pos_y && y < pos_y + this.height) {
                    var offset_x = x - pos_x;
                    var offset_y = y - pos_y;
                    var index = y * config.block_column_count + x;
                    var block_id = blocks[index];
                    var shape_block_id = this.data[offset_y * this.width + offset_x];
                    if (shape_block_id != 0 && block_id != 0)
                        return true;
                }
            }
        }
        return false;
    };
    Shape.prototype.bake = function (pos_x, pos_y, blocks) {
        for (var y = 0; y < this.height; y += 1) {
            for (var x = 0; x < this.width; x += 1) {
                var block_id = this.data[y * this.width + x];
                if (block_id)
                    blocks[(pos_y + y) * config.block_column_count + (pos_x + x)] = block_id;
            }
        }
    };
    Shape.prototype.rotated = function () {
        // Flip and invert into a new data buffer
        var new_data = new Int32Array(this.width * this.height);
        for (var y = 0; y < this.height; y++) {
            for (var x = 0; x < this.width; x++)
                new_data[x * this.height + (this.height - y - 1)] = this.data[y * this.width + x];
        }
        return new Shape(this.height, this.width, new_data);
    };
    return Shape;
}());

function clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
}
var FallingShape = /** @class */ (function () {
    function FallingShape(shape) {
        this.shape = shape;
        this.x = Math.floor(config.block_column_count / 2 - shape.get_width() / 2);
        this.y = 0;
    }
    FallingShape.prototype.get_shape = function () { return this.shape; };
    FallingShape.prototype.calculate_floor_y = function (blocks) {
        for (var y = this.y; y < config.block_row_count; y += 1) {
            if (this.shape.does_collide(this.x, y, blocks))
                return y - 1;
        }
        return config.block_row_count - this.shape.get_height();
    };
    FallingShape.prototype.draw_preview = function (blocks, draw_block) {
        // Calculate preview poistion
        var preview_y = this.calculate_floor_y(blocks);
        // Draw at preview position
        this.shape.draw(this.x, preview_y, draw_block, true);
    };
    FallingShape.prototype.draw = function (blocks, draw_block) {
        this.shape.draw(this.x, this.y, draw_block);
        this.draw_preview(blocks, draw_block);
    };
    FallingShape.prototype.move = function (by_x, by_y, blocks) {
        this.x += by_x;
        this.y += by_y;
        this.x = clamp(this.x, 0, config.block_column_count - this.shape.get_width());
        this.y = Math.max(this.y, 0);
        // Check collided with bottom of screen
        if (this.y > config.block_row_count - this.shape.get_height()) {
            this.y = config.block_row_count - this.shape.get_height();
            return true;
        }
        // Check collided with other block
        if (this.shape.does_collide(this.x, this.y, blocks)) {
            this.x -= by_x;
            this.y -= by_y;
            return true;
        }
        return false;
    };
    FallingShape.prototype.drop = function (blocks) {
        var floor_y = this.calculate_floor_y(blocks);
        this.y = floor_y;
    };
    FallingShape.prototype.rotate = function (blocks) {
        // Create new rotated shape
        var rotated_shape = this.shape.rotated();
        var new_x = clamp(this.x, 0, config.block_column_count - rotated_shape.get_width());
        var new_y = clamp(this.y, 0, config.block_row_count - rotated_shape.get_height());
        // Check if this collides with anything
        if (rotated_shape.does_collide(new_x, new_y, blocks))
            return;
        // Apply new shape
        this.shape = rotated_shape;
        this.x = new_x;
        this.y = new_y;
    };
    FallingShape.prototype.bake = function (blocks) {
        this.shape.bake(this.x, this.y, blocks);
    };
    return FallingShape;
}());

var Texture = /** @class */ (function () {
    function Texture(name) {
        var _this = this;
        this.name = name;
        this.image = document.createElement('img');
        this.has_loaded_flag = false;
        this.image.onload = function () {
            _this.has_loaded_flag = true;
        };
        this.image.src = 'image/' + name + '.png';
    }
    Texture.prototype.has_loaded = function () { return this.has_loaded_flag; };
    Texture.prototype.get_image = function () { return this.image; };
    return Texture;
}());

var small_overlay = new Texture("small_overlay");
var Icon = /** @class */ (function () {
    function Icon() {
        this.x = 0;
        this.y = 0;
        this.size = 100;
        this.update_size();
    }
    Icon.prototype.get_size = function () { return this.size; };
    Icon.prototype.get_shape = function () { return this.shape; };
    Icon.prototype.set_shape = function (shape) {
        this.shape = shape;
        this.shape = this.shape.rotated();
    };
    Icon.prototype.set_position = function (x, y) {
        this.x = x;
        this.y = y;
    };
    Icon.prototype.update_size = function () {
        this.block_size = this.size / 4.0;
    };
    Icon.prototype.draw = function (gc) {
        var _this = this;
        gc.fillStyle = '#888';
        gc.fillRect(this.x, this.y, this.size, this.size);
        if (this.shape) {
            var draw_block = function (x, y, block_id) {
                var pos_x = _this.x + x * _this.block_size;
                var pos_y = _this.y + y * _this.block_size;
                gc.fillStyle = config.pallet[block_id].make_css();
                gc.fillRect(pos_x, pos_y, _this.block_size, _this.block_size);
                if (small_overlay.has_loaded())
                    gc.drawImage(small_overlay.get_image(), pos_x, pos_y, _this.block_size, _this.block_size);
            };
            var x = Math.floor(2 - this.shape.get_width() / 2);
            var y = Math.floor(2 - this.shape.get_height() / 2);
            this.shape.draw(x, y, draw_block);
        }
    };
    return Icon;
}());

var key_arrow_left = 37;
var key_arrow_up = 38;
var key_arrow_right = 39;
var key_arrow_down = 40;
var key_space = 32;
var key_c = 67;
var shapes = [
    new Shape(4, 1, [1, 1, 1, 1]),
    new Shape(3, 2, [2, 0, 0,
        2, 2, 2]),
    new Shape(3, 2, [0, 0, 3,
        3, 3, 3]),
    new Shape(2, 2, [4, 4,
        4, 4]),
    new Shape(3, 2, [0, 5, 5,
        5, 5, 0]),
    new Shape(3, 2, [0, 6, 0,
        6, 6, 6]),
    new Shape(3, 2, [7, 7, 0,
        0, 7, 7]),
];
var Tetra = /** @class */ (function (_super) {
    __extends(Tetra, _super);
    function Tetra(canvas, options) {
        var _this = _super.call(this, canvas) || this;
        _this.options = options;
        _this.level = 1;
        _this.lines = 0;
        _this.score = 0;
        _this.start_time = performance.now();
        _this.update_timer = null;
        _this.blocks = new Int32Array(config.block_row_count * config.block_column_count);
        for (var i = 0; i < _this.blocks.length; i++)
            _this.blocks[i] = 0;
        _this.color_pallet = config.pallet;
        _this.big_overlay = new Texture('big_overlay');
        _this.falling = new FallingShape(_this.pick_new_shape());
        _this.lines_to_destroy = [];
        if (options.enable_hold)
            _this.hold = new Icon();
        _this.has_switched = false;
        _this.preview_stack = [];
        for (var i = 0; i < options.stack_count; i += 1) {
            var icon = new Icon();
            icon.set_shape(_this.pick_new_shape());
            _this.preview_stack.push(icon);
        }
        _this.resize();
        return _this;
    }
    Tetra.prototype.pick_new_shape = function () {
        var new_shape = shapes[Math.floor(Math.random() * (shapes.length - 1))];
        if (!this.preview_stack || this.preview_stack.length <= 0)
            return new_shape;
        var shape = this.preview_stack[0].get_shape();
        for (var i = 0; i < this.preview_stack.length - 1; i += 1)
            this.preview_stack[i].set_shape(this.preview_stack[i + 1].get_shape());
        this.preview_stack[this.preview_stack.length - 1].set_shape(new_shape);
        return shape;
    };
    Tetra.prototype.drop = function () {
        this.falling.drop(this.blocks);
        this.falling.bake(this.blocks);
        this.check_lines();
        this.falling = new FallingShape(this.pick_new_shape());
        this.has_switched = false;
    };
    Tetra.prototype.switch_hold = function () {
        if (!this.hold || this.has_switched)
            return;
        var curr_hold_shape = this.hold.get_shape();
        this.hold.set_shape(this.falling.get_shape());
        if (!curr_hold_shape) {
            this.falling = new FallingShape(this.pick_new_shape());
            return;
        }
        this.falling = new FallingShape(curr_hold_shape);
        this.has_switched = true;
    };
    Tetra.prototype.key_pressed = function (key_code) {
        if (this.falling) {
            switch (key_code) {
                case key_arrow_left:
                    this.falling.move(-1, 0, this.blocks);
                    break;
                case key_arrow_right:
                    this.falling.move(1, 0, this.blocks);
                    break;
                case key_arrow_up:
                    this.falling.rotate(this.blocks);
                    break;
                case key_space:
                    this.drop();
                    break;
                case key_c:
                    this.switch_hold();
                    break;
            }
        }
    };
    Tetra.prototype.check_lines = function () {
        var original_y = config.block_row_count;
        var lines_destroyed = 0;
        for (var y = config.block_row_count; y >= 0; y -= 1) {
            // Check to see if this line is full
            var is_line_full = true;
            for (var x = 0; x < config.block_column_count; x += 1) {
                var block_id = this.blocks[y * config.block_column_count + x];
                if (!block_id) {
                    is_line_full = false;
                    break;
                }
            }
            // If it is, move everying above it down
            if (is_line_full) {
                var this_line_index = y * config.block_column_count;
                this.blocks = this.blocks.copyWithin(config.block_column_count, 0, this_line_index);
                if (this.options.highlight_lines)
                    this.lines_to_destroy.push({ index: original_y, age: 0 });
                this.lines += 1;
                lines_destroyed += 1;
                y += 1;
            }
            original_y -= 1;
        }
        this.score += lines_destroyed * lines_destroyed;
    };
    Tetra.prototype.update = function () {
        var fall_rate = this.level;
        if (this.is_key_down(key_arrow_down))
            fall_rate = 10.0;
        if (!this.update_timer)
            this.update_timer = performance.now();
        if (performance.now() - this.update_timer >= 1000.0 / fall_rate) {
            this.update_timer = performance.now();
            if (this.falling) {
                var did_collide = this.falling.move(0, 1, this.blocks);
                if (did_collide) {
                    this.falling.bake(this.blocks);
                    this.check_lines();
                    this.falling = new FallingShape(this.pick_new_shape());
                    this.has_switched = false;
                }
            }
        }
        if (performance.now() - this.start_time >= 20000 * this.level) {
            this.level += 1;
            this.start_time = performance.now();
        }
    };
    Tetra.prototype.resize = function () {
        this.board_height = this.height - config.margin * 2;
        this.block_size = this.board_height / config.block_row_count;
        this.board_width = this.block_size * config.block_column_count;
        this.board_x = window.innerWidth / 2.0 - (this.board_width / 2.0);
        this.board_y = config.margin;
        if (this.hold)
            this.hold.set_position(this.board_x - this.hold.get_size() - 10, this.board_y);
        if (this.preview_stack) {
            for (var i = 0; i < this.preview_stack.length; i += 1) {
                var icon = this.preview_stack[i];
                icon.set_position(this.board_x + this.board_width + 10, this.board_y + (icon.get_size() + 10) * i);
            }
        }
    };
    Tetra.prototype.draw_border = function () {
        var gc = this.gc;
        gc.fillStyle = '#888';
        gc.fillRect(this.board_x, this.board_y, this.board_width, this.board_height);
    };
    Tetra.prototype.draw_blocks = function () {
        var _this = this;
        var gc = this.gc;
        gc.fillStyle = '#080';
        gc.strokeStyle = '#333';
        gc.lineWidth = 3;
        var draw_block = function (x, y, block_id, is_preview) {
            if (is_preview === void 0) { is_preview = false; }
            var color = Color.copy(_this.color_pallet[block_id]);
            if (is_preview)
                color.a = 0.2;
            gc.fillStyle = color.make_css();
            var block_x = _this.board_x + x * _this.block_size;
            var block_y = _this.board_y + y * _this.block_size;
            gc.fillRect(block_x, block_y, _this.block_size, _this.block_size);
            if (_this.big_overlay && _this.big_overlay.has_loaded()) {
                _this.gc.drawImage(_this.big_overlay.get_image(), block_x, block_y, _this.block_size, _this.block_size);
            }
        };
        if (this.falling)
            this.falling.draw(this.blocks, draw_block);
        for (var y = 0; y < config.block_row_count; y += 1) {
            for (var x = 0; x < config.block_column_count; x += 1) {
                var block_id = this.blocks[y * config.block_column_count + x];
                if (block_id != 0)
                    draw_block(x, y, block_id);
            }
        }
    };
    Tetra.prototype.draw_highlighted_lines = function () {
        if (this.lines_to_destroy) {
            var life_time = 20;
            var lines_done = [];
            for (var _i = 0, _a = this.lines_to_destroy; _i < _a.length; _i++) {
                var line = _a[_i];
                var alpha = 1.0 - Math.pow((line.age / life_time), 2);
                this.gc.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
                this.gc.fillRect(this.board_x, this.board_y + line.index * this.block_size, this.board_width, this.block_size);
                line.age += 1;
                if (line.age > life_time)
                    lines_done.push(line);
            }
            for (var _b = 0, lines_done_1 = lines_done; _b < lines_done_1.length; _b++) {
                var line = lines_done_1[_b];
                this.lines_to_destroy.splice(this.lines_to_destroy.indexOf(line), 1);
            }
        }
    };
    Tetra.prototype.draw_level = function () {
        var _this = this;
        var gc = this.gc;
        if (!this.preview_stack)
            return;
        var y_offset = 0;
        var draw_info = function (msg) {
            var text_size = 30;
            gc.fillStyle = '#000';
            gc.font = text_size + "px Georgia";
            gc.fillText(msg, _this.board_x + _this.board_width + 10, _this.board_y + 110 * _this.preview_stack.length +
                text_size + y_offset);
            y_offset += text_size + 10;
        };
        draw_info("Level: " + this.level);
        draw_info("Lines: " + this.lines);
        draw_info("Score: " + this.score);
    };
    Tetra.prototype.render = function () {
        this.draw_border();
        if (this.blocks)
            this.draw_blocks();
        if (this.hold)
            this.hold.draw(this.gc);
        if (this.preview_stack) {
            for (var _i = 0, _a = this.preview_stack; _i < _a.length; _i++) {
                var icon = _a[_i];
                icon.draw(this.gc);
            }
        }
        this.draw_highlighted_lines();
        this.draw_level();
    };
    return Tetra;
}(Window));

//import { html, render } from 'lit-html'
window.onload = function () {
    document.getElementById('play').onclick = function () {
        var menu = document.getElementById('menu');
        menu.setAttribute('style', 'display:none');
        var highlight_lines = document.getElementById('enable_hold');
        var enable_hold = document.getElementById('enable_hold');
        var stack_count = document.getElementById('stack_count');
        var options = {
            highlight_lines: highlight_lines.checked,
            enable_hold: enable_hold.checked,
            stack_count: stack_count.valueAsNumber,
            mode: document.getElementById('mode').nodeValue
        };
        var canvas = document.getElementsByTagName('canvas')[0];
        var tetra = new Tetra(canvas, options);
    };
};
//# sourceMappingURL=bundle.js.map
