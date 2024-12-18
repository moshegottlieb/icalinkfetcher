import { Config } from './config'
import { log } from './log'
import { Calendar } from './calendar'

async function main() {
    await Config.load()
    await Calendar.load()
    log.info('Logging in')
    await Calendar.shared.forEach( async (cal) => {
        try {
            log.debug(`Loading ${cal.serverUrl}`)
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

