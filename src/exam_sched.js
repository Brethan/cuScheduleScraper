const fs = require("fs");
const puppeteer = require("puppeteer");

async function cleanup(page, browser) {
	await page.close();
	await browser.close();
	return null;
}


const deptCodes = require("../data/dept_codes.json");

/** @type {string[][]} */
const sections = [];
const keys = Object.keys(deptCodes).sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));

/**
 * 
 * @param {string[]} departments 
 */
async function getExamSchedules(departments) {
	const url = "https://carleton.ca/ses/exam-schedule/";
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(url);
	
	while (true) {
		const b = await page.$eval("table[id=exams-table] tbody", 
			tbody => [...tbody.rows].map(r => [...r.cells].map(c => c.innerText)));
		if (!b[0][0].includes("Loading"))
			break;
	}
	console.log("Starting the", departments[0].charAt(0), "Departments");
	const exams = [];
	for (const dept of departments) {
		for (const code of deptCodes[dept]) {
			await page.$eval("input[aria-controls=exams-table]", el => el.value = "");
			await page.type("input[aria-controls=exams-table]", `${dept} ${code}`, { delay: 10 });
			const results = await page.$eval("table[id=exams-table] tbody",
				tbody => [...tbody.rows].map(r => [...r.cells].map(c => c.innerText)));

			results.forEach(exam => {
				if (!exam[0].includes("No matching")) {
					console.log(exam.join(" "));
					exams.push(exam);
				}
			});

			if (results[0][0].includes("No matching records found"))
				loser++;
		}
		
	}

	
	await cleanup(page, browser);
	return exams;
}

let loser = 0;




for (let i = 0, j = 0; i < (keys.length - 1); i++) {
	if (keys[i].charAt(0) !== keys[i + 1].charAt(0)) {
		sections.push(keys.slice(j, i + 1));
		j = i + 1;
		if ((j + 1) === keys.length) {
			sections.push(keys.slice(j));
		}
	}
}

// for (const arr of sections.slice(5)) {
// 	getExamSchedules(arr).then(exams => {
// 		fs.writeFileSync(`./output/${arr[0].charAt(0)}.json`, JSON.stringify(exams, null, 4));		
// 	})
// }

const sleep = async (n) => { 
	await new Promise(resolve => setTimeout(resolve, n * 1000));
	console.log(n, "done");
}

async function main() {
	for (let i = 0; i < sections.length; i += 5) {
		let max = ((i + 5) > sections.length) ? null : (i + 5);
		const departments = sections.slice(i, max);
		const exams = await Promise.all([
			getExamSchedules(departments[0]), 
			getExamSchedules(departments[1]), 
			getExamSchedules(departments[2]), 
			getExamSchedules(departments[3]), 
			getExamSchedules(departments[4]), 
		])

		for (const dArr of exams) {
			if (!dArr.length) continue;
			const letter = dArr[0][1].charAt(0);
			fs.writeFileSync(`./output/${letter}.json`, JSON.stringify(dArr, null, 4));
		}
	}
}

main()