
import { Canvas, TextMetrics, Context2D } from './canvas'
import { Event } from './calendar'

const logoH = 55
const logoW = 55


export class Agenda extends Canvas {
    private async title(): Promise<string> {
        const weather = await this.weather()
        const now = new Date()
        const degrees = weather.degrees === null ? '' : `, ${Math.round(weather.degrees)}°C`
        return `${now.toLocaleDateString([], { dateStyle: 'long' })} ${degrees}`
    }

    private async drawTitle() {
        const image = await this.loadImage('images/sense_logo.png')
        const title = await this.title()
        this.context.font = this.font(40, title)
        let metrics = this.context.measureText(title)
        this.offset += Canvas.HSpace
        let lh = this.lineHeight(metrics)
        let block = Math.max(logoH, lh) + Canvas.VSpace * 2
        let x = Canvas.HSpace
        //let y = (block - lh) / 2 + this.offset // for some reason, this line is not positioned in the correct y
        let y = (block + lh) / 2 + this.offset // for some reason, this shows correctly. the commented line above should be correct 🤷‍♂️
        this.context.fillText(title, x, y)
        x = Canvas.WIDTH - Canvas.HSpace - logoW - 1
        y = (block - logoH) / 2 + this.offset
        this.context.drawImage(image, x, y)
        this.offset += block
        this.context.setLineDash([10, 10])
        this.context.beginPath()
        this.context.moveTo(Canvas.HSpace, this.offset)
        this.context.lineTo(Canvas.WIDTH - 1 - Canvas.HSpace, this.offset)
        this.context.stroke()
        this.context.closePath()
        this.offset += Canvas.VSpace
    }

    private async drawEnd() {
        this.offset += Canvas.VSpace
        let fontSize = 30
        const remaining = Canvas.HEIGHT - this.offset
        const end = "No more events today"
        let metrics: TextMetrics
        // don't even try if we don't have 20px to spare, and break if font size is too small
        while (remaining > 17 && fontSize > 17) {
            this.context.font = this.font(fontSize, end)
            metrics = this.context.measureText(end)
            const lh = this.lineHeight(metrics)
            if (lh <= remaining) {
                // Can we move to the bottom?
                const best_offset = Canvas.HEIGHT - lh - Canvas.VSpace
                if (best_offset > this.offset) {
                    this.offset = best_offset
                }
                this.context.setLineDash([3, 3])
                this.context.beginPath()
                this.context.moveTo(Canvas.HSpace, this.offset + lh / 2)
                this.context.lineTo(Canvas.WIDTH / 2 - metrics.width / 2 - Canvas.HSpace, this.offset + lh / 2)
                this.context.stroke()
                this.context.closePath()
                this.context.fillText(end, Canvas.WIDTH / 2 - metrics.width / 2, this.offset + lh)
                this.context.beginPath()
                this.context.moveTo(Canvas.WIDTH / 2 + metrics.width / 2 + Canvas.HSpace, this.offset + lh / 2)
                this.context.lineTo(Canvas.WIDTH - 1 - Canvas.HSpace, this.offset + lh / 2)
                this.context.stroke()
                this.context.closePath()
                break
            } else {
                fontSize -= 1
            }
        }
    }

    private async drawLine(event: Event) {
        const fontSize = 26
        this.offset += Canvas.VSpace

        let body: string
        let suffix = ''
        if (event.isFullDay) {
            body = `${event.summary}`
            suffix = ' (all day)'
        }
        else {
            body = `${event.localizedStart} ${event.summary}`
        }
        const max_width = Canvas.WIDTH - 2 * Canvas.HSpace
        this.context.font = this.font(fontSize, body)
        body = await this.dotifyIfNeeded(body, suffix, max_width)
        let metrics = this.context.measureText(body + suffix)
        let box = this.lineHeight(metrics)
        this.offset += Canvas.VSpace
        this.context.fillText(body + suffix, Canvas.HSpace, this.offset)
        this.offset += box + Canvas.VSpace
        // Add a line if we have a location or event is longer than 5 minutes, but disregard duration of full day events
        body = ''
        suffix = ''
        if (!event.isFullDay && event.duration > 5 * 60) {
            body = event.localizedEnd + ' '
        }
        if (event.location) {
            body += event.location
        }
        if (body.length) {
            this.context.font = this.font(fontSize, body)
            body = await this.dotifyIfNeeded(body, suffix, max_width)
            metrics = this.context.measureText(body + suffix)
            box = this.lineHeight(metrics)
            this.context.fillText(body + suffix, Canvas.HSpace, this.offset)
            this.offset += box
        }
        this.context.beginPath()
        this.context.setLineDash([1, 1])
        this.context.moveTo(0, this.offset)
        this.context.lineTo(Canvas.WIDTH - 1, this.offset)
        this.context.stroke()
        this.context.closePath()
        this.offset += 1
    }

    async draw() {
        await this.drawTitle()
        // Draw full day events
        for (const e of Event.shared) {
            if (e.isFullDay) {
                await this.drawLine(e)
            }
        }
        // Draw full non full day events
        for (const e of Event.shared) {
            if (!e.isFullDay) {
                await this.drawLine(e)
            }
        }
        await this.drawEnd()
    }

    private offset = 0
}