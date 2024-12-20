import { Config  } from './config'
import { fetchUrl } from './fetch'

export class Weather {
    constructor(){
        this._degrees = null
    }
    async load(){
        const config = Config.shared.weather
        if (!config) return; // no weather
        const url = `https://api.brightsky.dev/current_weather?lat=${config.latitude}&lon=${config.longitude}&tz=${config['time-zone']}&units=dwd`
        const text = await fetchUrl(url)
        const obj = JSON.parse(text)
        if (obj.weather && typeof obj.weather.temperature === 'number'){
            this._degrees = obj.weather.temperature
        }
    }

    // optional
    get degrees():number{
        return this._degrees
    }
    private _degrees?:number
}