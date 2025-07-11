import { Config, CalendarType } from './config'
import { log } from './log'
import { Calendar } from './calendar'
import { Canvas } from './canvas'
import { Agenda } from './agenda'
import { Today } from './today'

async function main() {
    await Config.load()
    log.trace('Loaded configuration')

    if (Config.shared.locale) {
        log.info(`Setting locale to ${Config.shared.locale}`)
        process.env.LC_ALL = Config.shared.locale   
    }

    let canvas: Canvas

    if (Config.shared.type == CalendarType.agenda) {
        await Calendar.load()
        log.info(`Loaded ${Calendar.shared.length} calendars`)
        for (const cal of Calendar.shared) {
            try {
                log.trace(`Loading ${cal.serverUrl}`)
                await cal.load()
                log.trace(`Loaded ${cal.serverUrl}`)
            } catch (error) {
                let reason: string
                if (error instanceof Error) {
                    reason = `${error.name} : ${error.message}`
                } else {
                    reason = `${error}`
                }
                log.error(`Error loading ${cal.serverUrl}: ${reason}`)
            }
        };
        canvas = new Agenda()
    } else {
        canvas = new Today()
    }
    await canvas.draw()
    await canvas.save()
}

main().catch((reason) => {
    log.fatal(reason)
})

