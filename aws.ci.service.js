const AWS = require('aws-sdk');
const HTTPS = require('https');
const config = require('./config');
const path = require('path');

var Q = require('q');
require('q-foreach')(Q);

// configure the aws sdk
AWS.config.update(
    {
        accessKeyId: config.AWS.ACCESSKEY,
        secretAccessKey: config.AWS.SECRETKEY,
        region: config.AWS.REGION
    }
);

let gitHub_token = config.GIT_ACCESS_TOKEN;
let hostname = "api.github.com";

let codebuild = new AWS.CodeBuild();

getBuildSetStatus();

async function getBuildSetStatus() {
    let params = {};
    const projectListData = await codebuild.listProjects(params).promise();
    let projectNames = projectListData.projects;
    let statusMap = new Map();

    params = {
        names: projectNames
    };

    const projectData = await codebuild.batchGetProjects(params).promise();
    let projects = projectData.projects;

    for (let i = 0; i < projects.length; i++) {
        let project_name = projects[i].name;

        let git_url = projects[i].source.location;
        let git_repo = git_url.substring(git_url.lastIndexOf('/') + 1, git_url.lastIndexOf(".git"));

        let path = "/repos/intelematics/" + git_repo;
        const repoResponse = await makeHttpCall(gitHub_token, hostname, "GET", path);
        let resp = JSON.parse(repoResponse);
        let default_branch = resp['default_branch'];

        params = {
            projectName: project_name,
            sortOrder: 'DESCENDING'
        };
        const buildIds = await codebuild.listBuildsForProject(params).promise();
        params = {
            ids: buildIds.ids
        };
        const buildData = await codebuild.batchGetBuilds(params).promise();
        let builds = buildData.builds;
        for (let i = 0; i < builds.length; i++) {
            let sha_of_commit = builds[i].resolvedSourceVersion;
            path = "/repos/intelematics/" + git_repo + "/compare/" + default_branch + "..." + sha_of_commit;
            const response = await makeHttpCall(gitHub_token, hostname, "GET", path);
            resp = JSON.parse(response);
            let commit_status = resp['status'];
            console.log(commit_status);
            if (commit_status.toLowerCase() === 'behind' || commit_status.toLowerCase() === 'identical') {
                statusMap.set(project_name,builds[i].buildStatus);
                break;
            }
        }
    }

    console.log(statusMap);
}

function makeHttpCall(gitHub_token, hostname, method, path) {

    let options = {
        hostname: hostname,
        method: method,
        path: path,
        headers: {
            'Authorization': 'token ' + gitHub_token,
            'User-Agent': 'request'
        }
    };

    return new Promise((resolve, reject) => {

        const req = HTTPS.request(options, (response) => {
            let respBody = '';
            response.on('data', function (chunk) {
                respBody += chunk;
            }).on("end", () => {
                if (response.statusCode === 200 ||
                    response.statusCode === 201 ||
                    response.statusCode === 204) {
                    resolve(respBody);
                } else {
                    console.error("Error calling GitHub API with status Code " + response.statusCode);
                    reject(response.statusCode);
                }
            });
            response.on('error', (e) => {
                console.error(e.message);
                reject(e.message);
            });
        });

        req.on('error', (e) => {
            reject(e.message);
        });

        req.end();
    });
}

//
// // query the aws api and expose methods for jobs
// module.exports = {
//
//
//
// };
