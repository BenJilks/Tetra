import config from "./config"

export class Shape
{
    private width: number
    private height: number
    private data: Int32Array

    public constructor(width: number, height: number, data: any)
    {
        this.width = width
        this.height = height

        this.data = new Int32Array(width * height)
        for (let i = 0; i < data.length; i++)
            this.data[i] = data[i]
    }

    public get_width() { return this.width }
    public get_height() { return this.height }

    public get_block(x: number, y: number)
    {
        return this.data[y * this.width + x]
    }

    public draw(pos_x: number, pos_y: number, draw_block: CallableFunction, is_preview: boolean = false)
    {
        for (let y = 0; y < this.height; y += 1)
        {
            for (let x = 0; x < this.width; x += 1)
            {
                const block_id = this.get_block(x, y)
                if (block_id)
                    draw_block(pos_x + x, pos_y + y, block_id, is_preview)
            }
        }
    }

    public does_collide(pos_x: number, pos_y: number, blocks: Int32Array): boolean
    {
        for (let y = 0; y < config.block_row_count; y += 1)
        {
            for (let x = 0; x < config.block_column_count; x += 1)
            {
                if (x >= pos_x && x < pos_x + this.width &&
                    y >= pos_y && y < pos_y + this.height)
                {
                    const offset_x = x - pos_x
                    const offset_y = y - pos_y
                    
                    const index = y * config.block_column_count + x
                    const block_id = blocks[index]
                    const shape_block_id = this.data[offset_y * this.width + offset_x]
                    if (shape_block_id != 0 && block_id != 0)
                        return true
                }
            }                
        }

        return false
    }

    public bake(pos_x: number, pos_y: number, blocks: Int32Array)
    {
        for (let y = 0; y < this.height; y += 1)
        {
            for (let x = 0; x < this.width; x += 1)
            {
                const block_id = this.data[y * this.width + x]
                if (block_id)
                    blocks[(pos_y + y) * config.block_column_count + (pos_x + x)] = block_id
            }
        }
    }

    public rotated()
    {
        // Flip and invert into a new data buffer
        let new_data = new Int32Array(this.width * this.height)
        for (let y = 0; y < this.height; y++)
        {
            for (let x = 0; x < this.width; x++)
                new_data[x * this.height + (this.height - y - 1)] = this.data[y * this.width + x]
        }

        return new Shape(this.height, this.width, new_data)
    }

}
