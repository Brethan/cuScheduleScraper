const puppeteer = require("puppeteer");
const url = "https://central.carleton.ca/prod/bwysched.p_select_term?wsea_code=EXT";

/**
 * 
 * @param {string} dept 
 * @param {string} code 
 * @param {string} term
 * @returns 
 */
const searchCourses = async (dept, code, term) => {
    console.time("Time")
    const browser = await puppeteer.launch();
    const page = await browser.newPage()

    await page.goto(url);

    await page.select("#term_code", term);
    // await page.screenshot({path: "stage0.png"})
    for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
    }
    
    await Promise.all([page.keyboard.press("Enter"), page.waitForNavigation()]);    

    await page.select('#subj_id', dept.toUpperCase());
    await page.type("#number_id", code);
    // await page.screenshot({path: "stage1.png"})

    // for (let i = 0; i < 4; i++) {
    //     await page.keyboard.press("Tab");
    // }

    // await Promise.all([page.keyboard.press("Enter"), page.waitForNavigation()])
    await Promise.all([page.evaluate(()=> {
        document.querySelector('input[value=Search]').click();
    }), page.waitForNavigation()]);

    // await page.screenshot({path: "stage2.png"});
    let results;
    try {
        /** @type {string[][]} */
        results = await page.$eval('table tbody', tbody => [...tbody.rows].map(r => [...r.cells].map(c => c.innerText)))
        results.forEach((val, i, arr) => {arr[i] = [val[0].trim()]})
        console.log(results);
        results.splice(0, 3)
    } catch (error) {
        results = null
    }
    await page.close()
    await browser.close();
    console.timeEnd("Time")

    
    return results?.filter(val => val[0] !== "");
    
}

const main = async () => {

    const args = process.argv.slice(2);
    const results = await searchCourses(args[0] || "sysc", args[1] || "3310", args[2] || "202230");
    if (!results || !results.length) {
        console.log("Couldn't find shit bro, sorry :(");
        return;
    }   

    const courses_raw = results[0][0].split("\n");
    courses_raw.forEach((str, i, arr) => {arr[i] = str.trim()});

    const courses = courses_raw.filter((str) => str !== "");
    console.log(courses);
}

main();
