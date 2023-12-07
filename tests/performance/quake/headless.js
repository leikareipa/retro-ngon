import puppeteer from "puppeteer";

const resourceOrigin = (process.env.RESOURCE_ORIGIN || "http://localhost:8222");

(async()=>{
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    page.on("pageerror", ({message})=>terminate(message));
    await page.setCacheEnabled(false);

    const navi = await page.goto(`${resourceOrigin}/tests/performance/quake/${process.argv[2]}.html?headless`);
    if (!navi.ok()) {
        terminate(`Resource not found: ${navi.request().url()}`);
    }

    await page.waitForSelector("#benchmark-graph-container", {timeout: 0});
    const benchResults = await page.evaluate(()=>window.benchResults);
    const resolution = await page.evaluate(()=>Rngon.state.default.resolution);
    const [average, minimum, maximum] = (()=>{
        const renderFPS = benchResults.map(r=>r.renderFPS);
        return [
            Math.round(renderFPS.reduce((total, fps)=>(total + fps)) / benchResults.length),
            Math.round(Math.min(...renderFPS)),
            Math.round(Math.max(...renderFPS))
        ];
    })();

    console.log({average, minimum, maximum}, resolution);
    process.exit();
})();

function terminate(errorMessage) {
    process.stdout.write(`\x1b[37m\x1b[41m Error: ${errorMessage} \x1b[0m\n`);
    process.exit(1);
}
