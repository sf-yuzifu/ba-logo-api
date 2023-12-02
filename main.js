// 导入所需库
const puppeteer = require("puppeteer");
const {readdir, createReadStream, existsSync, readdirSync, statSync, unlinkSync, rmdirSync} = require("fs");
const {join} = require("path");
// 初始化API参数
let textL = "小鱼";
let textR = "档案";
let x = "-15";
let y = "0";
let tp = false;
// Sleep函数
const sleep = (timeout) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, timeout)
    })
}
// 删除文件夹
const _deleteDir = (url) => {
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
// 服务器配置
const express = require('express')
const app = express()
const port = 3000;
const cors = require('cors')
app.use(cors())
app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}/`)
});

/**
 * 主程序，其中
 * @param {string} l Logo左边文字
 * @param {string} r Logo右边文字
 * @param {string} x 光圈X坐标
 * @param {string} y 光圈Y坐标
 * @param {boolean} tp 是否透明背景
 */
app.get('/balogo', async function (ctx, res) {
    console.log(ctx.query);

    let random = Math.random().toString(36).slice(-8);
    textL = ctx.query.l || "";
    textR = ctx.query.r || "";
    x = ctx.query.x || "-15";
    y = ctx.query.y || "0";
    tp = ctx.query.tp || false;

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
    await page.waitForSelector('canvas');
    if (tp === "true") {
        await page.evaluate(() => {
            document.querySelector("#transparent").click()
        });
    }
    await page.evaluate(() => {
        document.querySelector("#textL").value = "";
        document.querySelector("#textR").value = "";
        document.querySelector("#graphX").value = "";
        document.querySelector("#graphY").value = "";
        document.querySelector(".collapse.collapse-arrow.bg-base-100 input").click()
    });
    await page.type('#graphX', x);
    await page.type('#graphY', y);
    await page.type('#textL', textL);
    await page.type('#textR', textR);
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


