import exp from 'node:constants'
import { readFile } from 'node:fs/promises'
import { log, configLog } from './log'


export class Config {

    url : URL
    username? : string
    password? : string
    type: Config.Type

    static async load(){
        const data = await readFile('config.json','utf-8')
        const config = JSON.parse(data)
        configLog(config['log-level'])
        const calendars = config.calendars
        if (!Array.isArray(calendars)){
            throw new Error('Config file is expected to include an array')
        }
        const array = calendars as Array<any>
        if (calendars.length == 0) {
            throw new Error('Config file is expected to include an array of at least one entry')
        }
        
        calendars.forEach((obj) =>{
            let cfg = new Config()
            if (!(typeof obj.url === 'string')){
                throw new Error('Each config entry should have a URL')
            }
            cfg.url = new URL(obj.url)
            if (typeof obj.username === 'string' && typeof obj.password === 'string'){
                cfg.username = obj.username
                cfg.password = obj.password
                cfg.type = Config.Type.CalDav
            } else {
                cfg.type = Config.Type.iCal
            }
            this.shared.push(cfg)
        })
    }

    static shared : Array<Config> = Array()

}

export namespace Config {
    export enum Type {
        CalDav,
        iCal
    }
}