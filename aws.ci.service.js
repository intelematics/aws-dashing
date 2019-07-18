const AWS = require('aws-sdk');
const config = require('./config');
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


let codebuild = new AWS.CodeBuild();

getBuildSetStatus();

async function getBuildSetStatus() {
    let params = {};
    const projectData = await codebuild.listProjects(params).promise();
    let projects = projectData.projects;
    console.log(projects);
    for (let i = 0; i < projects.length; i++) {
        params = {
            projectName: projects[i],
            sortOrder: 'DESCENDING'
        };
        const buildIds = await codebuild.listBuildsForProject(params).promise();
        params = {
            ids: buildIds.ids
        };
        const buildData = await codebuild.batchGetBuilds(params).promise();
        let builds = buildData.builds;
        for (let i = 0; i < builds.length; i++) {
            console.log(builds[i].resolvedSourceVersion);
        }
    }
}

//
// // query the aws api and expose methods for jobs
// module.exports = {
//
//
//
// };
