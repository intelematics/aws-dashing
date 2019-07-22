let CronJob         = require('cron').CronJob,
    aws_service     = require('../aws.ci.service'),
    ip              = require("ip"),
    config          = require("../config");

// DEFAULT CRON JOB, every x seconds

new CronJob(config.JOB_INTERVAL, function(){

    console.log('running cron job here at: ' + new Date());

    aws_service.getBuildSetStatus(function(err, data) {
        console.log(data);
        send_event("build", "SUCCESS");
    });

}, null, true, null);
