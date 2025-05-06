import { writeFile } from 'node:fs/promises'
const { createCanvas, loadImage, registerFont } = require('canvas')
import { Weather } from './weather'

export interface TextMetrics {
    width: number
    actualBoundingBoxLeft: number
    actualBoundingBoxRight: number
    actualBoundingBoxAscent: number
    actualBoundingBoxDescent: number
    emHeightAscent: number
    emHeightDescent: number
    alphabeticBaseline: number

}

export enum FontStyle {
    black = '900',
    'extra-bold' = '800',
    bold = '700',
    'semi-bold' = '600',
    medium = '500',
    regular = '400',
    light = '300',
    'extra-light' = '200',
    thin = '100'
}

export interface Context2D {
    fillStyle: string
    strokeStyle: string
    font: string
    measureText(text: string): TextMetrics

    fillRect(x: number, y: number, width: number, height: number): void
    fillText(text: string, x: number, y: number, maxWidth?: number): void

    beginPath(): void
    closePath(): void
    lineTo(x: number, y: number): void
    moveTo(x: number, y: number): void

    stroke(): void

    drawImage(image: any, x: number, y: number): void

    setLineDash(pattern: Array<number>): void

    imageSmoothingEnabled: boolean
    antialias: string
}


class Canvas {

    static WIDTH = 480
    static HEIGHT = 800
    static VSpace = 10
    static HSpace = 10


    protected Black = 'ArchivoBlack'
    protected Geneva = 'Geneva'
    protected Handjet = 'Handjet'
    protected Helvetica = 'Helvetica'


    constructor() {

        registerFont('fonts/geneva_9.ttf', { family: this.Geneva })
        registerFont('fonts/Handjet/static/Handjet-Regular.ttf', { family: this.Handjet })
        registerFont('fonts/Archivo_Black/ArchivoBlack-Regular.ttf', { family: this.Black })

        this.canvas = createCanvas(Canvas.WIDTH, Canvas.HEIGHT)
        this.context = this.canvas.getContext('2d')
        this.context.imageSmoothingEnabled = false
        this.context.antialias = 'none'
        this.context.fillStyle = 'white'
        this.context.fillRect(0, 0, Canvas.WIDTH, Canvas.HEIGHT)
        this.context.fillStyle = 'black'
        this.context.strokeStyle = 'black'
    }

    protected async dotifyIfNeeded(line: string, suffix: string, maxWidth: number): Promise<string> {
        if (line.length == 0) return line;
        line = line.split(/\r?\n|\r|\n/g)[0] // get the first line only
        if (this.dotsWidth === null) {
            const metrics = this.context.measureText(this.dots)
            this.dotsWidth = metrics.width
        }
        let metrics = this.context.measureText(line + suffix)
        const max_width = Canvas.WIDTH - 2 * Canvas.HSpace
        if (metrics.width > max_width) {
            while (metrics.width > (max_width - this.dotsWidth)) {
                line = line.substring(0, line.length - 1)
                metrics = this.context.measureText(line + suffix)
            }
            line += this.dots
        }
        return line
    }

    async weather(): Promise<Weather> {
        const weather = new Weather()
        const now = new Date()
        await weather.load()
        return weather
    }

    async draw() {
        // nothing by default
    }

    async loadImage(path: string): Promise<any> {
        return loadImage(path)
    }

    protected lineHeight(metrics: TextMetrics) {
        return Math.ceil(Math.abs(metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent))
    }

    containsHebrew(str: string): boolean {
        const hebrewRegex = /[\u0590-\u05FF]/;
        return hebrewRegex.test(str);
    }

    async save() {
        const buf = this.canvas.toBuffer()
        await writeFile('output.png', buf)
    }

    protected font(pixels: number, family: string,style?:FontStyle): string {
        let style_text = ''
        if (style !== undefined){
            style_text = `${style} `
        }
        return `${style_text}${pixels}px ${family}`
    }

    private formatTime(seconds: number): string {
        let ret = ''
        if (seconds >= 3600) {
            const hrs = Math.floor(seconds / 3600)
            ret += `${hrs}h`
            seconds = seconds % 3600 // trim to seconds
        }
        if (seconds >= 60) {
            ret += `${seconds / 60}m`
        }
        return ret
    }

    private dots = '...'
    private dotsWidth?: number = null
    protected context: Context2D
    private canvas: any
}

export { Canvas }