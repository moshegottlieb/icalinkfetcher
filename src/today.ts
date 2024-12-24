import { Canvas } from "./canvas";

export class Today extends Canvas {

    

    constructor(){
        super()
    }

    async draw(){
        let date_y = 0
        const now = new Date()
        const day = now.getDate()
        const dow = now.toLocaleString('en-US', {  weekday: 'short' }).toUpperCase()
        const date_font = this.font(350,this.Black)
        this.context.font = date_font
        let date_str = `${day}`
        let metrics = this.context.measureText(date_str)
        const date_width = metrics.width
        let lineHeight = this.lineHeight(metrics)
        date_y+=lineHeight
        const dow_font = this.font(180,this.Black)
        this.context.font = dow_font
        metrics = this.context.measureText(dow)
        lineHeight = this.lineHeight(metrics)
        let dow_y=lineHeight + 30
        let offset = (Canvas.HEIGHT - (dow_y + date_y)) / 2
        this.context.fillText(dow,(Canvas.WIDTH - metrics.width) / 2,dow_y + date_y + offset)
        this.context.font = date_font
        this.context.fillText(date_str,(Canvas.WIDTH - date_width) / 2,date_y + offset)
        this.context.font = this.font(60,this.Black)
        const month = now.toLocaleString('en-US', {  month: 'long' }).toUpperCase()
        metrics = this.context.measureText(month)
        lineHeight = this.lineHeight(metrics)
        this.context.fillText(month,(Canvas.WIDTH - metrics.width) / 2,Canvas.HEIGHT - Canvas.VSpace)
    }

    font(pixels:number,font:string) : string {
        return `900 ${pixels}px Helvetica`
    }
}