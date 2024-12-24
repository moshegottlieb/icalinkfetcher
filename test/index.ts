import { strict as assert } from 'assert'
import { CalendarConfig } from '../src/config'


type TestFn = () => (void | Promise<void>)
interface TestObject {
    name: string
    run: TestFn
}
type Tests = Array<TestObject>

const CLEAR = "\x1b[0m"
const BOLD = "\x1b[1m"
const FAIL = "\x1b[31m"
const OK = "\x1b[32m"
const RUN = "\x1b[33m"


class Test {
    constructor(tests: Tests) {
        this._tests = tests
    }

    async run() {

        const COUNT = '' + this._tests.length
        // Find max name length for preattier printing
        let name_len = 0
        for (let i = 0; i < this._tests.length; ++i) {
            let test = this._tests[i]
            name_len = Math.max(test.name.length, name_len)
        }
        for (let i = 0; i < this._tests.length; ++i) {
            let test = this._tests[i]
            process.stdout.write(`[${('' + (i + 1)).padStart(COUNT.length)}/${COUNT} ${RUN}${test.name.padEnd(name_len)}${CLEAR}] - ${BOLD}`)
            try {
                let ret = test.run()
                if (ret instanceof Promise) {
                    let wait = async (promise: Promise<void>) => {
                        return promise
                    }
                    await wait(ret)
                }
                process.stdout.write(`${OK}OK`)
            } catch (error) {
                process.stdout.write(`${FAIL}FAILED\n${error}`)
            } finally {
                process.stdout.write(`${CLEAR}\n`)
            }
        }
    }
    private _tests: Tests
}

let test = new Test([
    {
        name: 'Example test',
        run: async () => {
            assert.ok(1 == 1)
        }
    },
    {
        name: "Throws",
        run: () => {
            assert.throws(() => {
                throw new Error("This is expected")
            })
        }
    }
])
test.run()