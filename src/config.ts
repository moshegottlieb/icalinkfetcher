import { readFile } from 'node:fs/promises'
import { configLog } from './log'


export interface WeatherConfig {
    latitude: number
    longitude: number
    'time-zone': string
}

export enum CalendarType {
    agenda = 'agenda',
    today = 'today'
}



export class Config {


    weather?: WeatherConfig = null
    calendars: Array<CalendarConfig> = []
    type: CalendarType = CalendarType.agenda

    static get shared(): Config {
        return _shared
    }


    static async load() {

        const data = await readFile('config.json', 'utf-8')
        const config = JSON.parse(data)
        configLog(config['log-level'])
        const calendars = config.calendars
        if (!Array.isArray(calendars)) {
            throw new Error('Config file is expected to include an array')
        }
        const array = calendars as Array<any>
        if (calendars.length == 0) {
            throw new Error('Config file is expected to include an array of at least one entry')
        }

        const obj = config.weather

        if (typeof obj.longitude === 'number' &&
            typeof obj.latitude === 'number' &&
            typeof obj['time-zone'] === 'string') {
            _shared.weather = {
                latitude: obj.latitude,
                longitude: obj.longitude,
                'time-zone': obj['time-zone']
            }
        }

        let type = config['calendar-type'];
        switch (type) {
            case 'today':
                _shared.type = CalendarType.today
                break

        }

        calendars.forEach((obj) => {
            let cfg = new CalendarConfig()
            if (!(typeof obj.url === 'string')) {
                throw new Error('Each config entry should have a URL')
            }
            cfg.url = new URL(obj.url)
            if (typeof obj.username === 'string' && typeof obj.password === 'string') {
                cfg.username = obj.username
                cfg.password = obj.password
                cfg.type = CalendarConfig.Type.CalDav
            } else {
                cfg.type = CalendarConfig.Type.iCal
            }
            _shared.calendars.push(cfg)
        })


    }


}

let _shared = new Config()

export class CalendarConfig {

    url: URL
    username?: string
    password?: string
    type: CalendarConfig.Type
    weather?: WeatherConfig

    calendarType: CalendarType

}

export namespace CalendarConfig {
    export enum Type {
        CalDav,
        iCal
    }
}