import { Shape } from './shape'
import config from './config'
import { Texture } from './texture'

const small_overlay = new Texture("small_overlay")

export class Icon
{
    private shape: Shape
    private x: number
    private y: number
    private size: number
    private block_size: number

    public constructor()
    {
        this.x = 0
        this.y = 0
        this.size = 100
        this.update_size()
    }

    public get_size() { return this.size }
    public get_shape() { return this.shape }

    public set_shape(shape: Shape)
    {
        this.shape = shape
        this.shape = this.shape.rotated()
    }

    public set_position(x: number, y: number)
    {
        this.x = x
        this.y = y
    }

    private update_size()
    {
        this.block_size = this.size / 4.0
    }

    public draw(gc: CanvasRenderingContext2D)
    {
        gc.fillStyle = '#888'
        gc.fillRect(this.x, this.y, this.size, this.size)

        if (this.shape)
        {
            const draw_block = (x: number, y: number, block_id: number) =>
            {
                const pos_x = this.x + x * this.block_size
                const pos_y = this.y + y * this.block_size

                gc.fillStyle = config.pallet[block_id].make_css()
                gc.fillRect(pos_x, pos_y, this.block_size, this.block_size)

                if (small_overlay.has_loaded())
                    gc.drawImage(small_overlay.get_image(), pos_x, pos_y, this.block_size, this.block_size)
            }

            const x = Math.floor(2 - this.shape.get_width() / 2)
            const y = Math.floor(2 - this.shape.get_height() / 2)
            this.shape.draw(x, y, draw_block)
        }
    }

}
