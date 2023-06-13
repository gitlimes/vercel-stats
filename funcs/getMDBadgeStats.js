
export default async function getMDBadgeStats(page) {

    try {
        const dateNow = new Date().toISOString()
        const dateOneYearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString()
        const statsUrl = `https://vercel.com/api/v4/usage/top?projectId=prj_rk43KkLaPqpSgCbM7t5gZqW1iuoW&from=${encodeURIComponent(dateOneYearAgo)}&to=${encodeURIComponent(dateNow)}&limit=50&sortKey=requests&pathType=target_path`

        await page.goto(statsUrl);

        const rawStats = await page.evaluate(() => {
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

        return totalStats
    } catch (e) {
        console.log(e)
        return false
    }
}
