const http = require('http')
const https = require('https')


export async function fetchUrl(url:string) : Promise<string>{
    const ret = await _fetchUrl(url)
    return ret as string
}

const _fetchUrl = (url:string) => {
    return new Promise((resolve, reject) => {
        const http      = require('http'),
              https     = require('https');

        let client = http;

        if (url.toString().indexOf("https") === 0) {
            client = https;
        }

        client.get(url, (resp:any) => {
            let data = '';

            // A chunk of data has been recieved.
            resp.on('data', (chunk:any) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                resolve(data);
            });

        }).on("error", (err:any) => {
            reject(err);
        });
    });
};