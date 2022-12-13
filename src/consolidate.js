const { readdirSync, writeFileSync } = require("fs");
const { join, resolve } = require("path");
const dir = join(__dirname.replace("src", ""), "./output/");

const output = {};

let c = 0;
for (const json of readdirSync(dir).filter(file => file.endsWith(".json"))) {
	const exams = require(join(dir, json))
	for (const exam of exams) {
		const split = exam[1].split(' ');
		const dept = split[0], code = split[1], section = split[2];
		const startDate = exam[2], startTime = exam[3], length = exam[4], endDate = exam[5], 
			endTime = exam[6], loc = exam[7], type = exam[8];

		// Object for the department
		if (!output[dept]) output[dept] = {};
		// Object for the course code
		if (!output[dept][code]) output[dept][code] = {};
		// Array for the course sections
		if (!output[dept][code].sections) output[dept][code].sections = [];
		// There were some sneaky boys who showed up twice
		if (!output[dept][code].sections.includes(section)) {
			output[dept][code].sections.push(section);
			c++;
		}

		// Object for the exam details
		output[dept][code][section] = { 
			startDate: startDate,
			endDate: endDate,
			length: length,
			startTime: startTime, 
			endTime: endTime,
			loc: loc,
			type: type,
		};
	}
}

console.log(c);

writeFileSync(join(dir, "more_output/exams.json"), JSON.stringify(output, null, 4));