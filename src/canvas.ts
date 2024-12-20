import { writeFile } from 'node:fs/promises'
import { Event } from './calendar'
import { Weather } from './weather'
const { createCanvas, loadImage, registerFont } = require('canvas')


interface TextMetrics {
    width:number
    actualBoundingBoxLeft:number
    actualBoundingBoxRight:number
    actualBoundingBoxAscent:number
    actualBoundingBoxDescent:number
    emHeightAscent:number
    emHeightDescent:number
    alphabeticBaseline:number
    
}

enum FontStyle {
    black = 'black',
    bold = 'bold',
    'extra-bold' = 'extra-bold',
    'extra-light' = 'extra-light',
    light = 'light',
    medium = 'medium',
    regular = 'regular',
    'semi-bold' = 'semi-bold',
    thin = 'thin'
}

interface Context2D {
    fillStyle:string
    strokeStyle:string
    font:string
    measureText(text:string):TextMetrics

    fillRect(x:number,y:number,width:number,height:number):void
    fillText(text:string,x:number,y:number,maxWidth?:number):void

    beginPath():void
    closePath():void
    lineTo(x:number,y:number):void
    moveTo(x:number,y:number):void

    stroke():void

    drawImage(image:any,x:number,y:number):void

    setLineDash(pattern:Array<number>):void

    imageSmoothingEnabled:boolean
    antialias:string
}

const VSpace = 10
const HSpace = 10
const logoH = 55
const logoW = 55


class Canvas {

    static WIDTH = 480
    static HEIGHT = 800

    constructor(){
        registerFont('fonts/Handjet/static/Handjet-Regular.ttf', { family: 'Handjet' })
        this.canvas = createCanvas(Canvas.WIDTH,Canvas.HEIGHT)
        this.context = this.canvas.getContext('2d')
        this.context.imageSmoothingEnabled = false
        this.context.antialias = 'none'
        this.context.fillStyle = 'white'
        this.context.fillRect(0,0,Canvas.WIDTH,Canvas.HEIGHT)
        this.context.fillStyle = 'black'
        this.context.strokeStyle = 'black'
    }

    private async title() : Promise<string> { 
        const weather = new Weather()
        const now = new Date()
        await weather.load()
        const degrees = weather.degrees === null ? '' : `, ${Math.round(weather.degrees)}°C`
        return `${now.toLocaleDateString([], {dateStyle: 'long'})} ${degrees}`
    }

    private async drawTitle(){
        const image = await loadImage('images/sense_logo.png')
        const title = await this.title()
        this.context.font = this.font(40)
        let metrics = this.context.measureText(title)
        this.offset += HSpace
        let lh = this.lineHeight(metrics)
        let block = Math.max(logoH,lh) + VSpace * 2
        let x = HSpace
        let y = block / 2 + lh - VSpace + this.offset
        this.context.fillText(title,x,y)
        x = Canvas.WIDTH - HSpace - logoW - 1
        y = (block - logoH) / 2 + this.offset
        this.context.drawImage(image,x,y)
        this.offset += block
        this.context.setLineDash([10,10])
        this.context.beginPath()
        this.context.moveTo(HSpace,this.offset)
        this.context.lineTo(Canvas.WIDTH-1 - HSpace,this.offset)
        this.context.stroke()
        this.context.closePath()
        this.offset += VSpace
    }

    private async drawEnd(){
        this.offset += VSpace
        let fontSize = 30
        const remaining = Canvas.HEIGHT - this.offset
        const end = "No more events today"
        let metrics : TextMetrics
        // don't even try if we don't have 20px to spare, and break if font size is too small
        while (remaining > 17 && fontSize > 17) {
            this.context.font = this.font(fontSize)
            metrics = this.context.measureText(end)
            const lh = this.lineHeight(metrics)
            if (lh <= remaining){
                // Can we move to the bottom?
                const best_offset = Canvas.HEIGHT - lh - VSpace
                if (best_offset > this.offset){
                    this.offset = best_offset
                }
                this.context.setLineDash([3,3])
                this.context.beginPath()
                this.context.moveTo(HSpace,this.offset + lh / 2)
                this.context.lineTo(Canvas.WIDTH / 2 - metrics.width / 2 - HSpace,this.offset + lh / 2)
                this.context.stroke()
                this.context.closePath()
                this.context.fillText(end,Canvas.WIDTH /2 - metrics.width / 2,this.offset + lh)
                this.context.beginPath()
                this.context.moveTo(Canvas.WIDTH /2 + metrics.width / 2 + HSpace,this.offset + lh / 2)
                this.context.lineTo(Canvas.WIDTH - 1 - HSpace,this.offset + lh / 2)
                this.context.stroke()
                this.context.closePath()
                break
            } else {
                fontSize -= 1
            }
        }
    }

    private async drawLine(event:Event){
        this.offset += VSpace
        this.context.font = this.font(22)
        if (this.dotsWidth === null){
            const metrics = this.context.measureText(this.dots)
            this.dotsWidth = metrics.width
        }
        let body:string
        let suffix = ''
        if (event.isFullDay) {
            body = `${event.summary}`
            suffix = ' (all day)'
        }
        else {
            body = `${event.start.toLocaleTimeString([], {timeStyle: 'short'})} ${event.summary}`
            const duration = (event.end.getTime() - event.start.getTime()) / 1000 // seconds
            if (duration >= 60){
                suffix = ` (${this.formatTime(duration)})`
            }
        }
        let metrics = this.context.measureText(body + suffix)
        const max_width = Canvas.WIDTH - 2 * HSpace
        if (metrics.width > max_width){
            while (metrics.width > (max_width - this.dotsWidth)){
                body = body.substring(0,body.length -1)
                metrics = this.context.measureText(body + suffix)
            }
            body+=this.dots
        }
        const box = this.lineHeight(metrics) + 1
        this.offset += VSpace
        this.context.fillText(body + suffix,HSpace,box / 2 + this.offset)
        this.offset += box
        this.context.beginPath()
        this.context.setLineDash([1,1])
        this.context.moveTo(0,this.offset)
        this.context.lineTo(Canvas.WIDTH - 1,this.offset)
        this.context.stroke()
        this.context.closePath()
    }

    async draw(){
        await this.drawTitle()
        // Draw full day events
        for (const e of Event.shared){
            if (e.isFullDay){
                await this.drawLine(e)
            }
        }
        // Draw full non full day events
        for (const e of Event.shared){
            if (!e.isFullDay){
                await this.drawLine(e)
            }
        }
        await this.drawEnd()
    }

    private lineHeight(metrics:TextMetrics){
        return metrics.emHeightAscent - metrics.emHeightDescent
    }

    private font(pixels:number) : string {
        return `${pixels}px Handjet`
    }

    async save(){
        const buf = this.canvas.toBuffer()
        await writeFile('output.png',buf)
    }

    private formatTime(seconds:number) : string {
        let ret = ''
        if (seconds >= 3600){
            const hrs = Math.floor(seconds / 3600)
            ret+= `${hrs}h`
            seconds = seconds % 3600 // trim to seconds
        }
        if (seconds >= 60){
            ret+=`${seconds/60}m`
        }
        return ret
    }

    private dots = '...'
    private dotsWidth?:number = null
    private offset = 0
    private context : Context2D
    private canvas : any

}

export { Canvas }