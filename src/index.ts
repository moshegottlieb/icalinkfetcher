import { Config } from './config'
import { log } from './log'
import { Calendar } from './calendar'

async function main() {
    await Config.load()
    log.trace('Loaded configuration')
    await Calendar.load()
    log.info(`Loaded ${Calendar.shared.length} calendars`)
    await Calendar.shared.forEach( async (cal) => {
        try {
            log.trace(`Loading ${cal.serverUrl}`)
            await cal.load()

        } catch (error) {
            let reason:string
            if (error instanceof Error){
                reason = `${error.name} : ${error.message}`
            } else {
                reason = `${error}`
            }
            log.error(`Error loading ${cal.serverUrl}: ${reason}`)
        }
    });
}



main().catch((reason)=>{
    log.fatal(reason)
})

