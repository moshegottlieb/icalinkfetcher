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
    'extra-bold' = 'extra-bold',
    bold = 'bold',
    'semi-bold' = 'semi-bold',
    medium = 'medium',
    regular = 'regular',
    light = 'light',
    'extra-light' = 'extra-light',
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

    private camel(text:string){
        if (text.length == 0) return ''
        return text.substring(0,1).toUpperCase() + text.substring(1)
    }

    private fontFamily = 'Geneva'
    private hebFamily = 'Handjet'

    constructor(){
        registerFont('fonts/geneva_9.ttf',{ family: this.fontFamily })
        registerFont('fonts/Handjet/static/Handjet-Regular.ttf',{ family: this.hebFamily })
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
        this.context.font = this.font(40,title)
        let metrics = this.context.measureText(title)
        this.offset += HSpace
        let lh = this.lineHeight(metrics)
        let block = Math.max(logoH,lh) + VSpace * 2
        let x = HSpace
        //let y = (block - lh) / 2 + this.offset // for some reason, this line is not positioned in the correct y
        let y = (block + lh) / 2 + this.offset // for some reason, this shows correctly. the commented line above should be correct 🤷‍♂️
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
            this.context.font = this.font(fontSize,end)
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

    private async dotifyIfNeeded(line:string,suffix:string,maxWidth:number) : Promise<string> {
        if (line.length == 0) return line;
        line = line.split(/\r?\n|\r|\n/g)[0] // get the first line only
        if (this.dotsWidth === null){
            const metrics = this.context.measureText(this.dots)
            this.dotsWidth = metrics.width
        }
        let metrics = this.context.measureText(line + suffix)
        const max_width = Canvas.WIDTH - 2 * HSpace
        if (metrics.width > max_width){
            while (metrics.width > (max_width - this.dotsWidth)){
                line = line.substring(0,line.length -1)
                metrics = this.context.measureText(line + suffix)
            }
            line+=this.dots
        }
        return line
    }

    private async drawLine(event:Event){
        const fontSize = 26
        this.offset += VSpace
        
        let body:string
        let suffix = ''
        if (event.isFullDay) {
            body = `${event.summary}`
            suffix = ' (all day)'
        }
        else {
            body = `${event.localizedStart} ${event.summary}`
        }
        const max_width = Canvas.WIDTH - 2 * HSpace
        this.context.font = this.font(fontSize,body)
        body = await this.dotifyIfNeeded(body,suffix,max_width)
        let metrics = this.context.measureText(body + suffix)
        let box = this.lineHeight(metrics)
        this.offset += VSpace
        this.context.fillText(body + suffix,HSpace,this.offset)
        this.offset += box + VSpace
        // Add a line if we have a location or event is longer than 5 minutes, but disregard duration of full day events
        body = ''
        suffix = ''
        if (!event.isFullDay && event.duration > 5 * 60){
            body = event.localizedEnd + ' '
        }
        if (event.location){
            body += event.location
        }
        if (body.length){
            this.context.font = this.font(fontSize,body)
            body = await this.dotifyIfNeeded(body,suffix,max_width)
            metrics = this.context.measureText(body + suffix)
            box = this.lineHeight(metrics)
            this.context.fillText(body + suffix,HSpace,this.offset)
            this.offset += box
        }
        this.context.beginPath()
        this.context.setLineDash([1,1])
        this.context.moveTo(0,this.offset)
        this.context.lineTo(Canvas.WIDTH - 1,this.offset)
        this.context.stroke()
        this.context.closePath()
        this.offset += 1
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
        return Math.ceil(Math.abs(metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent))
    }

    containsHebrew(str:string):boolean {
        const hebrewRegex = /[\u0590-\u05FF]/;
        return hebrewRegex.test(str);
    }

    private font(pixels:number,text:string,style:FontStyle = FontStyle.regular) : string {
        const isHebrew = this.containsHebrew(text)
        // I don't know how to do font style at this stage, nor do I feel like exploring it
        return `${isHebrew ? pixels - 2 :  pixels + 2}px ${isHebrew ? this.hebFamily : this.fontFamily}`
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