import puppeteer from "puppeteer"
import 'dotenv/config'

import express from 'express';
import favicon from "serve-favicon";
import path from "path";

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

import getDCBadgeStats from "./funcs/getDCBadgeStats.js"

const app = express();
const port = 2251;

app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')));

puppeteer.launch({ headless: "new", args: ['--no-sandbox'] }).then(async browser => {
    console.log("launched hehe")
    const page = await browser.newPage();

    const cookies = JSON.parse(process.env.VERCEL_COOKIES)
    await page.setCookie(...cookies)

    app.get('/', (_req, res) => {
        res.send('Returns some stats about my Vercel deployments!\n\nSource code at: https://github.com/gitlimes/vercel-stats')
    })

    let dcbadgeCache = {};

    let reqSinceCrash = 0;

    let fetching = false;

    app.get('/dcbadge', async (_req, res) => {
        if (
            (!dcbadgeCache.cached || (Math.floor(Date.now() / 1000) - dcbadgeCache.cachedOn) > 900)
            &&
            !fetching
        ) {
            fetching = true;
            console.log(`[info] [${new Date().toLocaleTimeString()}] fetching updated data (req since crash: ${reqSinceCrash})`)

            const totalStats = await getDCBadgeStats(page);

            if (!totalStats) {
                return res.json(dcbadgeCache)
            }

            dcbadgeCache = { ...totalStats };
            dcbadgeCache.cached = true;
            dcbadgeCache.cachedOn = Math.floor(Date.now() / 1000)

            res.json(totalStats)
            fetching = false
        } else {
            console.log(`[info] [${new Date().toLocaleTimeString()}] serving cached data (req since crash: ${reqSinceCrash})`)
            res.json(dcbadgeCache)
        }

        reqSinceCrash++;
    })

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}/`)
    })

})