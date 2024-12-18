import { Logger, ILogObj } from "tslog";
const _log: Logger<ILogObj> = new Logger()


class Log {
    fatal(message:any){
        _log.fatal(message)
    }
    error(message:any){
        _log.error(message)
    }
    warning(message:any){
        _log.warn(message)
    }
    info(message:any){
        _log.info(message)
    }
    debug(message:any){
        _log.debug(message)
    }
    trace(message:any){
        _log.trace(message)
    }

}

function configLog(option:any){
    if (typeof option === 'string'){
        switch (option) {
            case 'trace':
                _log.settings.minLevel = 0
                break
            case 'debug':
                _log.settings.minLevel = 3
                break
            case 'warning':
                _log.settings.minLevel = 5
                break
            case 'error':
                _log.settings.minLevel = 6
                break
            case 'info':
            default:
                _log.settings.minLevel = 4
                break
        }
        _log.settings.prettyLogTemplate = "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}}\t{{logLevelName}}\t"
    }
}

const log = new Log()

export { log , configLog }