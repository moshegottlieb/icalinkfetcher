import { off } from "process";
import { Canvas } from "./canvas";

export class Today extends Canvas {
    async draw(){
        let date_y = 0
        const now = new Date()
        const day = now.getDate()
        const dow = now.toLocaleString('en-US', {  weekday: 'short' })
        const date_font = this.font(415,'','')
        this.context.font = date_font
        let date_str = `${day}`
        let metrics = this.context.measureText(date_str)
        const date_width = metrics.width
        let lineHeight = this.lineHeight(metrics)
        date_y+=lineHeight
        const dow_font = this.font(200,'',this.blackFamily)
        this.context.font = dow_font
        metrics = this.context.measureText(dow)
        lineHeight = this.lineHeight(metrics)
        let dow_y=lineHeight + 30
        let offset = (Canvas.HEIGHT - (dow_y + date_y)) / 2
        this.context.fillText(dow,(Canvas.WIDTH - metrics.width) / 2,dow_y + date_y + offset)
        this.context.font = date_font
        this.context.fillText(date_str,(Canvas.WIDTH - date_width) / 2,date_y + offset)
    }
}