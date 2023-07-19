const puppeteer = require('puppeteer');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'skillshare.csv',
    header: [
        { id: 'url', title: 'URL' },
        { id: 'h1', title: 'Title' },
        { id: 'projects', title: 'Projects' },
        { id: 'enrollments', title: 'Enrollments' },
        { id: 'level', title: 'Level' },
        { id: 'duration', title: 'Duration' },
        { id: 'instructor', title: 'Instructor' },
        { id: 'related_skills', title: 'Related Skills' },
        { id: 'review', title: 'Review' },
    ],
    append: true
});

async function scrapeCourseDetails(url) {
    // Wait for the enroll button to appear and click it
    const browser = await puppeteer.launch({ headless: "new" }); // change headless to true to run in headless mode
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const courseDetails = [];

    try {
        await page.waitForSelector('span.title');
        const h1 = await page.$eval('span.title', el => el.innerText.trim());
        await page.waitForSelector('p.class-count.number');
        const enrollments = await page.$eval('div.stat p.class-count', el => el.textContent.trim());
        const projects = await page.$eval('div.stat:nth-last-child(1) p.class-count', el => el.textContent.trim());
        await page.waitForSelector('div.level-text li.active');
        const level = await page.$eval('div.level-text li.active', el => el.textContent);
        const duration = await page.$eval('div.lesson-count', el => el.innerText.trim());
        const instructor = await page.$eval('a.class-details-header-teacher-link', el => el.innerText.trim());
        const related_skills = await page.$$eval('a.tag.light', ele => ele.map(el => el.text));
        const review = await page.$$eval('li.enabled-expectation', ele => ele.map(el => el.innerText));


        const data = {
            url,
            h1,
            projects,
            enrollments,
            level,
            duration,
            instructor,
            related_skills,
            review 
        };
        courseDetails.push(data);
        await csvWriter.writeRecords([data]);
    } catch (error) {
        console.error(`Error scraping course details for ${url}: ${error.message}`);
    }

    await browser.close();

    // Return the scraped data
    return courseDetails;

}

async function scrapeCoursesDirectory() {
    const courseDetails = [];
    for (let i = 1; i <= 1796; i++) {
        const browser = await puppeteer.launch({ headless: "new" }); // change headless to true to run in headless mode
        const page = await browser.newPage();
        await page.goto(`https://www.skillshare.com/en/browse?sort=popular&time=all&page=${i}`, {timeout: 50000});
        // Wait for the courses to load and get the links
        await page.waitForSelector('a.class-link');
        const links = await page.$$eval('a.class-link', els => els.map(el => el.href));        

        // Navigate to the course page
        console.log(i);
        for (const link of links) {
            // Navigate to the course page
            const details = await scrapeCourseDetails(link);
            courseDetails.push(details);

        }
        // Close the browser and return the scraped data
        await browser.close();
        return courseDetails;

    }
}

scrapeCoursesDirectory()
    .then(data => console.log(data))
    .catch(error => console.error(error));
