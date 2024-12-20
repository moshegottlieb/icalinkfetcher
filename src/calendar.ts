import { DAVClient } from 'tsdav';
import { Config } from './config';
import { log } from './log';
const ICAL = require('ical.js');

class Event {
    constructor(summary:string,start:Date,end:Date){
        this.summary = summary
        this.start = start
        this.end = end
    }
    summary: string
    start:Date
    end:Date
    get isFullDay() : boolean {
        return 
            this.start.getUTCMinutes() == this.end.getUTCMinutes() &&
            this.start.getUTCHours() == this.end.getUTCHours() &&
            this.start.getUTCSeconds() == this.end.getUTCSeconds() &&
            Math.abs(this.end.getTime() - this.start.getTime()) >= (24 * 3600 * 1000)
    }

    static shared : Array<Event> = Array()

    static addEvents(events:Array<Event>){
        if (events.length == 0) return;
        this.shared = this.shared.concat(events)
        this.shared.sort( (a:Event,b:Event) => {
            return a.end.getTime() - b.end.getTime()
        })
    }
}

class Calendar {
    constructor(config:Config){
        this.config = config
    }

    static load(){
        this.now = new Date()
        this.eod = new Date(
            this.now.getFullYear(),
            this.now.getMonth(),
            this.now.getDate(),
            23,
            59,
            59,
            0 // Set hours, minutes, seconds, and milliseconds
          );
        this.bod = new Date(
            this.now.getFullYear(),
            this.now.getMonth(),
            this.now.getDate(),
            0,
            0,
            0,
            0 // Set hours, minutes, seconds, and milliseconds
        )
        this.now_time = this.now.getTime()
        this.eod_time = this.eod.getTime()
        this.bod_time = this.bod.getTime()
        for (const config of Config.shared.calendars){
            let cal : Calendar
            switch (config.type){
                case Config.Type.CalDav:
                    cal = new CalDavCalendar(config)
                    break
                case Config.Type.iCal:
                    cal = new iCalCalendar(config)
                    break
                default:
                    throw new Error(`Unknow calendar type: ${config.type}`)
            }
            this.shared.push(cal)
        }
    }

    async load(){
        throw new Error('Not implemented')
    }

    static shared = Array<Calendar>()

    // event:ICal.Event doesn't work, dunno why
    protected filter(event:any) : boolean {
        const end_date = event.endDate.toJSDate()
        const start_date = event.startDate.toJSDate()
        const start = start_date.getTime()
        const end = end_date.getTime()
        return Calendar.now_time < end && Calendar.eod_time >= start // does this event occur today, and is still taking place?
    }

    public get serverUrl() : URL {
        return this.config.url
    }

    protected static now:Date
    private static now_time : number
    protected static eod:Date
    private static eod_time : number
    private static bod : Date
    private static bod_time : number
    
    protected config:Config
}

class iCalCalendar extends Calendar {

    async load(){
        const response = await fetch(this.config.url)
        if (!response.ok){
            throw new Error(`Error fetching ${this.config.url}: ${response.status} ${response.statusText}`)
        }
        const text = await response.text()
        this.parse(text)
    }

    parse(rawData:string){
        const jcalData = ICAL.parse(rawData);
        const component = new ICAL.Component(jcalData);
        let events: Array<Event> = Array()
        for (let event of component.getAllSubcomponents('vevent')){
            const vevent = new ICAL.Event(event);
            if (this.filter(vevent)){
                const e = new Event(
                    vevent.summary,
                    vevent.startDate.toJSDate(),
                    vevent.endDate.toJSDate())
                events.push(e)
            }
        }
        Event.addEvents(events);
    }


}

class CalDavCalendar extends iCalCalendar {
    constructor(config:Config){
        super(config)
        this.client = new DAVClient({
            serverUrl:config.url.toString(),
            credentials: {
                username:config.username,
                password:config.password
            },
            authMethod: 'Basic',
            defaultAccountType: 'caldav'
        })
    }

    async load(){
        log.trace(`Logging into to ${this.serverUrl}`)
        await this.client.login()
        log.trace(`Logged into to ${this.serverUrl}`)
        log.trace(`Fetching calendars from ${this.serverUrl}`)
        const calendars = await this.client.fetchCalendars();
        log.trace(`Calendars from ${this.serverUrl} fetched`)
        const start = Calendar.now.toISOString()
        const end = Calendar.eod.toISOString()
        for (const cal of calendars){
            const objects = await this.client.fetchCalendarObjects({
                calendar: cal,
                timeRange: {
                    start: start,
                    end: end
                }
            });
            for (const obj of objects){
                const rawData = obj.data;
                if (!(typeof rawData === 'string')) return; // ignore invalid data
                this.parse(rawData)
            }
        }
        Event.shared.forEach( (event)=>{
            log.debug(`${event.start}-${event.end} - event.summary`)
        })
    }
    private client:DAVClient
}


export { Calendar, Event }