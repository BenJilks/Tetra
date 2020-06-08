import { Shape } from './shape'
import config from './config'

function clamp(num: number, min: number, max: number)
{
    return num <= min ? min : num >= max ? max : num
}

export class FallingShape
{

    private shape: Shape
    private x: number
    private y: number

    public constructor(shape: Shape)
    {
        this.shape = shape
        this.x = Math.floor(config.block_column_count / 2 - shape.get_width() / 2)
        this.y = 0
    }

    public get_shape() { return this.shape }

    private calculate_floor_y(blocks: Int32Array): number
    {
        for (let y = this.y; y < config.block_row_count; y += 1)
        {
            if (this.shape.does_collide(this.x, y, blocks))
                return y - 1
        }

        return config.block_row_count - this.shape.get_height()
    }

    private draw_preview(blocks: Int32Array, draw_block: CallableFunction)
    {
        // Calculate preview poistion
        const preview_y = this.calculate_floor_y(blocks)

        // Draw at preview position
        this.shape.draw(this.x, preview_y, draw_block, true)
    }

    public draw(blocks: Int32Array, draw_block: CallableFunction)
    {
        this.shape.draw(this.x, this.y, draw_block)
        this.draw_preview(blocks, draw_block)
    }

    public move(by_x: number, by_y: number, blocks: Int32Array): boolean
    {
        this.x += by_x
        this.y += by_y
        this.x = clamp(this.x, 0, config.block_column_count - this.shape.get_width())
        this.y = Math.max(this.y, 0)

        // Check collided with bottom of screen
        if (this.y > config.block_row_count - this.shape.get_height())
        {
            this.y = config.block_row_count - this.shape.get_height()
            return true
        }

        // Check collided with other block
        if (this.shape.does_collide(this.x, this.y, blocks))
        {
            this.x -= by_x
            this.y -= by_y
            return true
        }

        return false
    }

    public drop(blocks: Int32Array)
    {
        const floor_y = this.calculate_floor_y(blocks)
        this.y = floor_y
    }

    public rotate(blocks: Int32Array)
    {
        // Create new rotated shape
        const rotated_shape = this.shape.rotated()
        const new_x  = clamp(this.x, 0, config.block_column_count - rotated_shape.get_width())
        const new_y = clamp(this.y, 0, config.block_row_count - rotated_shape.get_height())

        // Check if this collides with anything
        if (rotated_shape.does_collide(new_x, new_y, blocks))
            return
        
        // Apply new shape
        this.shape = rotated_shape
        this.x = new_x
        this.y = new_y
    }

    public bake(blocks: Int32Array)
    {
        this.shape.bake(this.x, this.y, blocks)
    }

}
