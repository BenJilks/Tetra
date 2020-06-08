import { Window } from './window'
import { Shape } from './shape'
import { FallingShape } from './fallingshape'
import { Icon } from './icon'
import { Color } from './config'
import { Texture } from './texture'
import config from './config'

const key_arrow_left = 37 
const key_arrow_up = 38
const key_arrow_right = 39
const key_arrow_down = 40
const key_space = 32
const key_c = 67

const shapes = [
    new Shape(4, 1,
        [1, 1, 1, 1]),
    
    new Shape(3, 2,
        [2, 0, 0,
         2, 2, 2]),
    
    new Shape(3, 2,
        [0, 0, 3,
        3, 3, 3]),
            
    new Shape(2, 2,
        [4, 4,
         4, 4]),
    
    new Shape(3, 2,
        [0, 5, 5,
         5, 5, 0]),
    
    new Shape(3, 2,
        [0, 6, 0,
         6, 6, 6]),
        
    new Shape(3, 2,
        [7, 7, 0,
         0, 7, 7]),
]

class Line
{
    public index: number
    public age: number
}

export class Tetra extends Window
{
    private board_x: number
    private board_y: number
    private board_width: number
    private board_height: number

    private block_size: number
    private blocks: Int32Array
    private color_pallet: Array<Color>
    private big_overlay: Texture

    private falling: FallingShape
    private update_timer: number

    private hold: Icon
    private preview_stack: Array<Icon>
    private has_switched: boolean
    private lines_to_destroy: Array<Line>
    private options: any

    private level: number
    private lines: number
    private score: number
    private start_time: number

    public constructor(canvas: HTMLCanvasElement, options: any)
    {
        super(canvas)
        this.options = options
        this.level = 1
        this.lines = 0
        this.score = 0
        this.start_time = performance.now()

        this.update_timer = null
        this.blocks = new Int32Array(config.block_row_count * config.block_column_count)
        for (let i = 0; i < this.blocks.length; i++)
            this.blocks[i] = 0

        this.color_pallet = config.pallet
        this.big_overlay = new Texture('big_overlay')
        this.falling = new FallingShape(this.pick_new_shape())
        this.lines_to_destroy = []
        
        if (options.enable_hold)
            this.hold = new Icon()

        this.has_switched = false
        this.preview_stack = []
        for (let i = 0; i < options.stack_count; i += 1)
        {
            let icon = new Icon()
            icon.set_shape(this.pick_new_shape())
            this.preview_stack.push(icon)
        }

        this.resize()
    }

    private pick_new_shape()
    {
        const new_shape = shapes[Math.floor(Math.random() * (shapes.length - 1))]
        if (!this.preview_stack || this.preview_stack.length <= 0)
            return new_shape
        
        const shape = this.preview_stack[0].get_shape()
        for (let i = 0; i < this.preview_stack.length - 1; i += 1)
            this.preview_stack[i].set_shape(this.preview_stack[i + 1].get_shape())
        this.preview_stack[this.preview_stack.length - 1].set_shape(new_shape)
        
        return shape
    }

    private drop()
    {
        this.falling.drop(this.blocks)
        this.falling.bake(this.blocks)
        this.check_lines()
        this.falling = new FallingShape(this.pick_new_shape())
        this.has_switched = false
    }

    private switch_hold()
    {
        if (!this.hold || this.has_switched)
            return

        const curr_hold_shape = this.hold.get_shape()
        this.hold.set_shape(this.falling.get_shape())
        if (!curr_hold_shape)
        {
            this.falling = new FallingShape(this.pick_new_shape())
            return
        }
        
        this.falling = new FallingShape(curr_hold_shape)
        this.has_switched = true
    }

    protected key_pressed(key_code: number): void
    {
        if (this.falling)
        {
            switch (key_code)
            {
                case key_arrow_left: this.falling.move(-1, 0, this.blocks); break
                case key_arrow_right: this.falling.move(1, 0, this.blocks); break
                case key_arrow_up: this.falling.rotate(this.blocks); break
                case key_space: this.drop(); break
                case key_c: this.switch_hold(); break
            }
        }
    }

    private check_lines()
    {
        let original_y = config.block_row_count
        let lines_destroyed = 0

        for (let y = config.block_row_count; y >= 0; y -= 1)
        {
            // Check to see if this line is full
            let is_line_full = true
            for (let x = 0; x < config.block_column_count; x += 1)
            {
                const block_id = this.blocks[y * config.block_column_count + x]
                if (!block_id)
                {
                    is_line_full = false
                    break
                }
            }

            // If it is, move everying above it down
            if (is_line_full)
            {
                const this_line_index = y * config.block_column_count
                this.blocks = this.blocks.copyWithin(config.block_column_count, 0, this_line_index)
                if (this.options.highlight_lines)
                    this.lines_to_destroy.push({ index: original_y, age: 0 })
                this.lines += 1
                lines_destroyed += 1
                y += 1
            }

            original_y -= 1
        }

        this.score += lines_destroyed * lines_destroyed
    }

    protected update(): void
    {
        let fall_rate = this.level
        if (this.is_key_down(key_arrow_down))
            fall_rate = 10.0

        if (!this.update_timer)
            this.update_timer = performance.now()
        
        if (performance.now() - this.update_timer >= 1000.0 / fall_rate)
        {
            this.update_timer = performance.now()

            if (this.falling)
            {
                const did_collide = this.falling.move(0, 1, this.blocks)
                if (did_collide)
                {
                    this.falling.bake(this.blocks)
                    this.check_lines()
                    this.falling = new FallingShape(this.pick_new_shape())
                    this.has_switched = false
                }
            }
        }

        if (performance.now() - this.start_time >= 20000 * this.level)
        {
            this.level += 1
            this.start_time = performance.now()
        }
    }

    protected resize(): void
    {
        this.board_height = this.height - config.margin * 2
        this.block_size = this.board_height / config.block_row_count

        this.board_width = this.block_size * config.block_column_count
        this.board_x = window.innerWidth / 2.0 - (this.board_width / 2.0)
        this.board_y = config.margin

        if (this.hold)
            this.hold.set_position(this.board_x - this.hold.get_size() - 10, this.board_y)
        
        if (this.preview_stack)
        {
            for (let i = 0; i < this.preview_stack.length; i += 1)
            {
                let icon = this.preview_stack[i]
                icon.set_position(
                    this.board_x + this.board_width + 10,
                    this.board_y + (icon.get_size() + 10) * i)
            }
        }
    }

    private draw_border()
    {
        const gc = this.gc

        gc.fillStyle = '#888'
        gc.fillRect(this.board_x, this.board_y, this.board_width, this.board_height)
    }

    private draw_blocks()
    {
        const gc = this.gc

        gc.fillStyle = '#080'
        gc.strokeStyle = '#333'
        gc.lineWidth = 3

        const draw_block = (x: number, y: number, block_id: number, is_preview = false) =>
        {
            const color = Color.copy(this.color_pallet[block_id])
            if (is_preview)
                color.a = 0.2
            gc.fillStyle = color.make_css()

            const block_x = this.board_x + x * this.block_size
            const block_y = this.board_y + y * this.block_size
            gc.fillRect(block_x, block_y, this.block_size, this.block_size)

            if (this.big_overlay && this.big_overlay.has_loaded())
            {
                this.gc.drawImage(this.big_overlay.get_image(),
                    block_x, block_y, this.block_size, this.block_size)
            }
        }

        if (this.falling)
            this.falling.draw(this.blocks, draw_block)

        for (let y = 0; y < config.block_row_count; y += 1)
        {
            for (let x = 0; x < config.block_column_count; x += 1)
            {
                const block_id = this.blocks[y * config.block_column_count + x]
                if (block_id != 0)
                    draw_block(x, y, block_id)
            }
        }
    }

    private draw_highlighted_lines()
    {
        if (this.lines_to_destroy)
        {
            const life_time = 20
            let lines_done = []

            for (let line of this.lines_to_destroy)
            {
                const alpha = 1.0 - Math.pow((line.age / life_time), 2)
                
                this.gc.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')'
                this.gc.fillRect(
                    this.board_x, this.board_y + line.index * this.block_size,
                    this.board_width, this.block_size)
                
                line.age += 1
                if (line.age > life_time)
                    lines_done.push(line)
            }

            for (let line of lines_done)
                this.lines_to_destroy.splice(this.lines_to_destroy.indexOf(line), 1)
        }
    }

    private draw_level()
    {
        const gc = this.gc
        if (!this.preview_stack)
            return

        let y_offset = 0
        const draw_info = (msg: string) =>
        {
            const text_size = 30

            gc.fillStyle = '#000'
            gc.font = `${text_size}px Georgia`
            gc.fillText(msg,
                this.board_x + this.board_width + 10,
                this.board_y + 110 * this.preview_stack.length +
                    text_size + y_offset)
            
            y_offset += text_size + 10
        }

        draw_info(`Level: ${this.level}`)
        draw_info(`Lines: ${this.lines}`)
        draw_info(`Score: ${this.score}`)
    }

    protected render(): void
    {
        this.draw_border()
        if (this.blocks)
            this.draw_blocks()
        
        if (this.hold)
            this.hold.draw(this.gc)
        if (this.preview_stack)
        {
            for (let icon of this.preview_stack)
                icon.draw(this.gc)
        }

        this.draw_highlighted_lines()
        this.draw_level()
    }
}
