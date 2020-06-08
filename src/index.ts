//import { html, render } from 'lit-html'
import { Tetra } from './tetra'

window.onload = () =>
{
    document.getElementById('play').onclick = () =>
    {
        const menu = <HTMLDivElement>document.getElementById('menu')
        menu.setAttribute('style', 'display:none')

        const highlight_lines = <HTMLInputElement> document.getElementById('enable_hold')
        const enable_hold = <HTMLInputElement>document.getElementById('enable_hold')
        const stack_count = <HTMLInputElement>document.getElementById('stack_count')
        const options =
        {
            highlight_lines: highlight_lines.checked,
            enable_hold: enable_hold.checked,
            stack_count: stack_count.valueAsNumber,
            mode: document.getElementById('mode').nodeValue
        }

        const canvas = document.getElementsByTagName('canvas')[0]
        const tetra = new Tetra(canvas, options)
    }
}
