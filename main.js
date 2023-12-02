const express = require('express')
const app = express()
const port = 3000;
const cors = require('cors')
const puppeteer = require("puppeteer");
const {readdir, createReadStream, existsSync, readdirSync, statSync, unlinkSync, rmdirSync} = require("fs");
const {join} = require("path");

let textL = "小鱼";
let textR = "档案";

const sleep = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout)
    })
}

function _deleteDir(url) {
    let files = [];
    if (existsSync(url)) {
        files = readdirSync(url);
        files.forEach(function (file) {
            let curPath = join(url, file);
            if (statSync(curPath).isDirectory()) {
                _deleteDir(curPath);
            } else {
                unlinkSync(curPath);
            }
        });
        rmdirSync(url);
        console.log('清除目录', url);
    } else {
        console.log('路径不存在！');
    }
}

app.use(cors())

app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}/`)
});

app.get('/balogo', async function (ctx, res) {
    let random = Math.random().toString(36).slice(-8);
    console.log(ctx.query);
    textL = ctx.query.l || "";
    textR = ctx.query.r || "";
    const browser = await puppeteer.launch({
        headless: true
    });
    const page = await browser.newPage();
    await page.goto("https://tmp.nulla.top/ba-logo/");
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: `./pic/${random}/`
    });
    await page.evaluate(() => {
        document.querySelector("#textL").value = "";
        document.querySelector("#textR").value = "";
    });
    await page.waitForSelector('canvas');
    await page.type('#textL', textL, {
        delay: 0,
    });
    await page.type('#textR', textR, {
        delay: 0,
    });
    await page.waitForSelector('#loading.hidden');
    await page.waitForSelector('#loading:not(.hidden)');
    await page.waitForSelector('#loading.hidden');
    await sleep(500);
    await page.evaluate(() => {
        document.querySelector("#save").click();
    });
    await sleep(500);
    await browser.close()

    readdir(`./pic/${random}/`, {recursive: false}, (err, files) => {
        console.log(files)
        res.setHeader('Access-Control-Allow-Origin', '*')
        const cs = createReadStream(`./pic/${random}/${files[0]}`);
        cs.on("data", chunk => {
            res.write(chunk);
        })
        cs.on("end", () => {
            res.status(200);
            res.end();
            _deleteDir(`./pic/${random}/`);
        })
    })
})


