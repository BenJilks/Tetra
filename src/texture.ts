
export class Texture
{
    
    private name: string
    private image: HTMLImageElement
    private has_loaded_flag: boolean

    public constructor(name: string)
    {
        this.name = name
        this.image = document.createElement('img')

        this.has_loaded_flag = false
        this.image.onload = () =>
        {
            this.has_loaded_flag = true
        }
        this.image.src = 'image/' + name + '.png'
    }

    public has_loaded() { return this.has_loaded_flag }
    public get_image() { return this.image; }

}
