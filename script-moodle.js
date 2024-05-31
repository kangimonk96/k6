import http from 'k6/http';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js"
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
//import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export let options = {
    stages: [
        { duration: '30s', target: 10 }, // Ramp up to 10 users
        { duration: '1m', target: 50 },  // Stay at 10 users for 1 minute
	{ duration: '2m', target: 100 },  // Stay at 10 users for 1 minute
//	{ duration: '1m', target: 200 },  // Stay at 10 users for 1 minute
//	{ duration: '1m', target: 300 },  // Stay at 10 users for 1 minute
        { duration: '30s', target: 0 },  // Ramp down to 0 users
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1500'],
	'http_req_failed': ['rate<0.01'],
    },
};

const BASE_URL = 'https://example[dot]id';
const USERNAME = 'username'; // fill moodle username
const PASSWORD = 'password'; // fill moodle password

// Counter to track login failures
var loginFailCounter = new Counter('login_failures');

export default function () {
    // 1. User login
    let loginRes = http.post(`${BASE_URL}/login/index.php`, {
        username: USERNAME,
        password: PASSWORD,
    });

    check(loginRes, {
        'login successful': (resp) => resp.status === 200,
    }) || loginFailCounter.add(1);

    let cookies = loginRes.cookies;

    // 2. Navigate to a course
    let courseRes = http.get(`${BASE_URL}/course/view.php?id=2`, { cookies: cookies }); // match your URL course
    check(courseRes, {
        'course page loaded': (resp) => resp.status === 200,
    });
    // 3. Perform actions (e.g., view a resource, submit a quiz, etc.)
    let resourceRes = http.get(`${BASE_URL}/mod/quiz/view.php?id=3`, { cookies: cookies }); // match your URL quiz course
    check(resourceRes, {
        'resource page loaded': (resp) => resp.status === 200,
    });
	
    // Simulate think time
    sleep(1);
}

// Generate test report
export function handleSummary(data) {
    return {
        "reportmoodle.html": htmlReport(data),
    };
}
