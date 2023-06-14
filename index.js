import puppeteer from "puppeteer"
import 'dotenv/config'

import express from 'express';
import favicon from "serve-favicon";
import path from "path";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import getMDBadgeStats from "./funcs/getMDBadgeStats.js"

const app = express();
const port = 2251;

app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')));

puppeteer.launch({ headless: "new" }).then(async browser => {
    console.log("launched hehe")
    const page = await browser.newPage();

    const cookies = JSON.parse(process.env.VERCEL_COOKIES)
    await page.setCookie(...cookies)

    app.get('/', (_req, res) => {
        res.send('Returns some stats about my Vercel deployments!\n\nSource code at: https://github.com/gitlimes/vercel-stats')
    })

    let mdbadgeCache = {};

    let reqSinceCrash = 0;

    let fetching = false;

    app.get('/mdbadge', async (_req, res) => {
        if (
            (!mdbadgeCache.cached || (Math.floor(Date.now() / 1000) - mdbadgeCache.cachedOn) > 900)
            &&
            !fetching
        ) {
            fetching = true;
            console.log(`[info] [${new Date().toLocaleTimeString()}] fetching updated data (req since crash: ${reqSinceCrash})`)

            const totalStats = await getMDBadgeStats(page);

            if (!totalStats) {
                return res.json(mdbadgeCache)
            }

            mdbadgeCache = { ...totalStats };
            mdbadgeCache.cached = true;
            mdbadgeCache.cachedOn = Math.floor(Date.now() / 1000)

            res.json(totalStats)
            fetching = false
        } else {
            console.log(`[info] [${new Date().toLocaleTimeString()}] serving cached data (req since crash: ${reqSinceCrash})`)
            res.json(mdbadgeCache)
        }

        reqSinceCrash++;
    })

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}/`)
    })

})

