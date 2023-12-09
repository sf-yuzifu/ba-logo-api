// 导入所需库
const puppeteer = require("puppeteer");
// 初始化API参数
let textL = "蔚蓝";
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
// 服务器配置
const express = require('express')
const app = express()
const port = 3000;
const cors = require('cors')
app.use(cors())
app.listen(port, () => {
    console.log(`Server is running on http://127.0.0.1:${port}/`)
});

// 新建本地生成器
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.render('index');
});

/**
 * 主程序，其中
 * @param {string} l Logo左边文字
 * @param {string} r Logo右边文字
 * @param {string} x 光圈X坐标
 * @param {string} y 光圈Y坐标
 * @param {boolean} tp 是否透明背景
 */
let browser;
(async function () {
    browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
})()
app.get('/balogo', async function (ctx, res) {
    console.log(ctx.query);

    let random = Math.random().toString(36).slice(-8);
    textL = ctx.query.l || "蔚蓝";
    textR = ctx.query.r || "档案";
    x = ctx.query.x || "-15";
    y = ctx.query.y || "0";
    tp = ctx.query.tp || false;

    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/`);
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
    await sleep(100);
    const imgButton = await page.waitForSelector("#base64")
    await imgButton.click();
    await sleep(100);
    const imgBase64 = await page.$eval('#base64', el => el.innerText);
    await page.close();
    // 将获取到的Base64编码转为Buffer
    res.setHeader('Access-Control-Allow-Origin', '*')
    const base64 = imgBase64.replace(/^data:image\/\w+;base64,/, "");
    res.write(new Buffer.from(base64, 'base64'));
    res.status(200);
    res.end();
})