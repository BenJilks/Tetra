
export abstract class Window
{

    private canvas: HTMLCanvasElement
    protected gc: CanvasRenderingContext2D
    protected width: number
    protected height: number

    private key_buffer: Array<number>
    private keys_down: Array<number>

    public constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas
        this.gc = canvas.getContext('2d')
        this.width = canvas.width
        this.height = canvas.height
        this.key_buffer = []
        this.keys_down = []

        window.addEventListener('resize', () => { this.do_resize() })
        window.requestAnimationFrame(() => { this.do_render() })

        window.addEventListener('keydown', (e) =>
        {
            if (!this.keys_down.includes(e.keyCode))
                this.keys_down.push(e.keyCode)
            this.key_buffer.push(e.keyCode)
        }, true)
        window.addEventListener('keyup', (e) =>
        {
            const index = this.keys_down.indexOf(e.keyCode);
            if (index > -1)
                this.keys_down.splice(index, 1);
        }, true)

        this.do_resize()
    }

    protected abstract render(): void
    protected abstract resize(): void
    protected abstract update(): void
    protected abstract key_pressed(key_code: number): void

    protected is_key_down(key_code: number)
    {
        return this.keys_down.includes(key_code)
    }

    private do_render()
    {
        this.gc.fillStyle = '#FFF';
        this.gc.fillRect(0, 0, this.width, this.height)
        this.render()
        
        for (let i = 0; i < this.key_buffer.length; i++)
            this.key_pressed(this.key_buffer[i])
        this.key_buffer = []
        
        this.update()
        window.requestAnimationFrame(() => { this.do_render() })
    }

    private do_resize()
    {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        this.width = this.canvas.width
        this.height = this.canvas.height

        this.resize()
        this.do_render()
    }

}
