const puppeteer = require("puppeteer");
const path = require("path");

(async()=>{
    const browser = await puppeteer.launch({headless: "new"});
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    await page.goto(`file://${path.resolve("./tests/unit/index.html")}`);
    const testResults = await page.evaluate(()=>unitTestResults);

    // String means something went wrong while initializing the system.
    if (typeof testResults === "string") {
        terminate(testResults);
    }

    for (const test of testResults)
    {
        process.stdout.write(` ....  ${test.unit}  `);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        if (test.passed) {
            process.stdout.write(`\x1b[37m\x1b[42m PASS \x1b[0m ${test.unit}\n`);
        }
        else {
            process.stdout.write(`\x1b[37m\x1b[41m FAIL \x1b[0m ${test.unit}: ${test.error}\n`);
        }
    }
    
    process.exit(testResults.some(r=>!r.passed));
})();

function terminate(errorMessage) {
    process.stdout.write(`\x1b[37m\x1b[41m Error: ${errorMessage} \x1b[0m\n`);
    process.exit(1);
}
