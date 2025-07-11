import { Canvas,FontStyle } from "./canvas";
import { Weather } from "./weather";
import { log } from './log';
import { Config } from "./config";

export class Today extends Canvas {

    

    constructor(){
        super()
    }

    async draw(){
        const weather = new Weather()
        let degrees = null
        try {
            await weather.load()
            degrees = weather.degrees
        } catch (e){
            log.error(`Error loading weather data:  ${e}`)
        }
        let min_height = 0
        if (degrees !== null) {
            degrees = Math.round(degrees)
            const font = this.font(120,this.Helvetica,FontStyle.black)
            this.context.font = font
            let text = `${degrees}°`
            const metrics = this.context.measureText(text)
            const width = metrics.width
            let text_x = (Canvas.WIDTH - width) / 2
            if (weather.icon) {
                try {
                    const icon = await this.loadImage(`images/n_${weather.icon}.png`)
                    if (icon != null){
                        //this.context.fillStyle = 'black'
                        //this.context.fillRect(0,0,Canvas.WIDTH,Canvas.HEIGHT)
                        //this.context.fillStyle = 'white'
                        text_x -= (icon.width + 8) / 2
                        min_height = icon.height
                        this.context.drawImage(icon, text_x + width + 8, 0)
                    }
                } catch (e){
                    log.error(`Error loading icon:  ${e}`)
                }
            }
            let text_y = this.lineHeight(metrics)
            if (min_height){
                text_y += Math.abs(min_height - this.lineHeight(metrics)) / 2
            }
            this.context.fillText(text,text_x,text_y)
        }
        let date_y = 0
        const now = new Date()
        const day = now.getDate()
        const dow = now.toLocaleString(Config.shared.locale, {  weekday: 'short' }).toUpperCase()
        const date_font = this.font(400,this.Helvetica,FontStyle.black)
        this.context.font = date_font
        let date_str = `${day}`
        let metrics = this.context.measureText(date_str)
        const date_width = metrics.width
        let lineHeight = this.lineHeight(metrics)
        date_y+=lineHeight
        const dow_font = this.font(210,this.Helvetica,FontStyle.black)
        this.context.font = dow_font
        metrics = this.context.measureText(dow)
        lineHeight = this.lineHeight(metrics)
        let dow_y=lineHeight + 30
        let offset = (Canvas.HEIGHT - (dow_y + date_y)) / 2
        this.context.fillText(dow,(Canvas.WIDTH - metrics.width) / 2,dow_y + date_y + offset)
        this.context.font = date_font
        this.context.fillText(date_str,(Canvas.WIDTH - date_width) / 2,date_y + offset)
        this.context.font = this.font(90,this.Helvetica,FontStyle.black)
        const month = now.toLocaleString(Config.shared.locale, {  month: 'long' }).toUpperCase()
        metrics = this.context.measureText(month)
        lineHeight = this.lineHeight(metrics)
        this.context.fillText(month,(Canvas.WIDTH - metrics.width) / 2,Canvas.HEIGHT - Canvas.VSpace)
    }

}