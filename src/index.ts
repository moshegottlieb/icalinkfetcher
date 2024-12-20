import { Config } from './config'
import { log } from './log'
import { Calendar } from './calendar'
import { Canvas } from './canvas'

async function main() {
    await Config.load()
    log.trace('Loaded configuration')
    await Calendar.load()
    log.info(`Loaded ${Calendar.shared.length} calendars`)
    for (const cal of Calendar.shared){
        try {
            log.trace(`Loading ${cal.serverUrl}`)
            await cal.load()
            log.trace(`Loaded ${cal.serverUrl}`)
        } catch (error) {
            let reason:string
            if (error instanceof Error){
                reason = `${error.name} : ${error.message}`
            } else {
                reason = `${error}`
            }
            log.error(`Error loading ${cal.serverUrl}: ${reason}`)
        }
    };
    const canvas = new Canvas()
    await canvas.draw()
    await canvas.save()
}

main().catch((reason)=>{
    log.fatal(reason)
})

