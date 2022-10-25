const rp = require('request-promise');


async function getDepartmentCourseCodes(dept, under = true) {
	const marker = "#owo#";
	const courseblock = `<span class="courseblockcode">`;
	/** @type {string} */
	const html = (await rp(`https://calendar.carleton.ca/${under ? "under" : ""}grad/courses/${dept}/`));
	const start = html.indexOf(`<div class="courseblock">`);
	const raw = html.replace(/&#160;/gi, marker)
		.substring(start)
		.split("\n")
		.filter(val => val.includes(courseblock));

	const results = raw.map(str => {
		const i = str.indexOf(marker) + marker.length;
		const j = str.indexOf("<", i);
		return str.substring(i, j);
	});

	return results;
}

/**
 *
 * @param {string[]} departments
 */
async function getAllCourseCodes(departments) {
	const obj = {};
	const removeDept = [];
	for (const str of departments) {
		let classes = [];
		try {
			classes = classes.concat(await getDepartmentCourseCodes(str.toUpperCase()));
		} catch (error) {
			// Department has no undergrad courses
		}

		try {
			classes = classes.concat(await getDepartmentCourseCodes(str.toUpperCase(), false));
		} catch (error) {
			// Department has no grad courses
		}

		if (classes.length)
			obj[str] = classes;
		else
			removeDept.push(departments.indexOf(str));


	}

	for (const i of removeDept)
		departments.splice(i, 1);

	return obj;
}

async function getAllDepartments() {

	/** @param {"undergrad" | "grad"} level */
	const getDepartmentAtLevel = async (level = "undergrad") => {
		const url = `https://calendar.carleton.ca/${level}/courses/`;
		/** @type {string} */
		const html = await rp(url);
		const raw = html.split("\n")
			.filter(str => str.includes("a href=") && !str.includes("class="))
			.map(str => str.trim().replace(/<br\/>|<span>|<\/span>|<p>/gi, ""));

		const firstCourse = raw.findIndex(val => val.match(/AERO|ACCT/));
		const lastCourse = raw.findIndex(val => val.match(/WGST/)) + 1;

		const courseCodes = raw.slice(firstCourse, lastCourse).map(str => {
			const i = str.indexOf(">");
			const j = str.indexOf("<", i);
			return str.substring(i + 1, j).replace(")", "");
		});

		return courseCodes;
	};

	const output = (await getDepartmentAtLevel("undergrad")).concat(await getDepartmentAtLevel("grad"));
	const departments = Array.from(new Set(output));

	return departments;
}

module.exports = async () => {
	// departments[]
	const departments = await getAllDepartments();
	// [department: ["####"]]
	return await getAllCourseCodes(departments);

};
