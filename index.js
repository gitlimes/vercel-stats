const puppeteer = require("puppeteer")
require('dotenv').config()

const express = require("express")
const app = express()
const port = 2251

puppeteer.launch({ headless: "new" }).then(async browser => {
    console.log("launched hehe")
    const page = await browser.newPage();

    const cookies = JSON.parse(process.env.VERCEL_COOKIES)
    await page.setCookie(...cookies)

    app.get('/', (_req, res) => {
        res.send('Returns some stats about my Vercel deployments!\n\nSource code at: https://github.com/gitlimes/vercel-stats')
    })

    app.get('/mdbadge', async (req, res) => {
        const dateNow = new Date().toISOString()
        const dateOneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()
        const statsUrl = `https://vercel.com/api/v4/usage/top?projectId=prj_rk43KkLaPqpSgCbM7t5gZqW1iuoW&from=${encodeURIComponent(dateOneYearAgo)}&to=${encodeURIComponent(dateNow)}&limit=50&sortKey=requests&pathType=target_path`
    
        await page.goto(statsUrl);
    
        rawStats = await page.evaluate(() => {
            return JSON.parse(document.querySelector("body").innerText).data;
        });

        const funcStats = rawStats.filter(item => {
            return item.type === "func"
        })
        const userStats = funcStats.filter(item => {
            return (item.target_path === "/api/shield/[user]") || (item.target_path === "/api/json/[user]")
        })
        const serverStats = funcStats.filter(item => {
            return (item.target_path === "/api/server/[invite]")
        })

        const totalStats = {
            user: 0,
            server: 0,
            total: 0,
            sourceCode: "https://github.com/gitlimes/vercel-stats"
        }

        userStats.forEach(item => {
            totalStats.user += item.requests
        })
        serverStats.forEach(item => {
            totalStats.server += item.requests
        })
        totalStats.total = totalStats.user + totalStats.server

        res.json(totalStats)
    })

    app.listen(port, () => {
        console.log(`Server listening on port ${port}`)
    })

})

