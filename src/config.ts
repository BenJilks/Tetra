
export class Color
{
    public r: number
    public g: number
    public b: number
    public a: number

    public constructor(r: number, g: number, b: number)
    {
        this.r = r
        this.g = g
        this.b = b
        this.a = 1
    }

    public static copy(other: Color): Color
    {
        const color = new Color(other.r, other.g, other.b)
        color.a = other.a
        return color
    }

    public make_css(): string
    {
        return "rgba(" +
            this.r + ", " +
            this.g + ", " +
            this.b + ", " +
            this.a + ")"
    }
}

export default 
{
    margin: 50,
    block_row_count: 20,
    block_column_count: 10,
    preview_stack_size: 5,
    
    pallet: <Array<Color>>
    [
        new Color(140.1, 219.5, 114.9), // Green
        new Color(243.5, 57.2, 57.2), // Red
        new Color(118.0, 96.4, 234.3), // Purple
        new Color(102.6, 189.7, 224.7), // Blue
        new Color(234.3, 234.3, 107.9), // Yellow
        new Color(252.0, 138.9, 213.7), // Pink
        new Color(255, 255, 255) // White
    ]
}
