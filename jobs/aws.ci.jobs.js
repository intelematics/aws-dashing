var async           = require('async'),
    CronJob         = require('cron').CronJob,
    aws_service     = require('../aws.service'),
    ip              = require("ip"),
    config          = require("../config");

// DEFAULT CRON JOB, every x seconds

new CronJob(config.JOB_INTERVAL, function(){

    console.log('running cron job here at: ' + new Date());

    // send events for Meter widgets

    aws_service.getEC2InstanceLimit(function(err, limit){
        if (!err) {
            aws_service.getEC2Instances(function(err, ec2_instances){
                if (!err) {
                    var length = ec2_instances.length
                    //summary.ec2_instances = length;
                    send_event('ec2', {value: length, max: limit});
                }
            })
        }
    });
}, null, true, null);

// // send events for List widgets every 5 seconds
// setInterval(function() {
//     summary.gd_findings_count = Object.values(summary.gd_findings).reduce((a, b) => a + b, 0);
//     send_event('gd_findings_count', { text: summary.gd_findings_count});
// }, 1 * 1000);

// send events for List widgets every 5 seconds
// setInterval(function() {
//     send_event('summary', { items: [
//         { label:"GuardDuty Findings", value: summary.gd_findings_count },
//         { label:"EC2 instances", value:summary.ec2_instances },
//         { label:"Security Groups", value:summary.security_groups },
//         { label:"Elastic Load Balancers", value:summary.elbs },
//         { label:"Elastic IPs", value:summary.elastic_ips },
//         { label:"S3 Buckets", value:summary.s3_buckets },
//         { label:"S3 Objects", value:summary.s3_objects },
//         { label:"RDS instances", value:summary.rds_instances },
//         { label:"R53 zones", value:summary.r53_hosted_zones },
//         { label:"R53 records", value:summary.r53_records },
//         { label:"ElastiCache clusters", value:summary.ec_clusters },
//         { label:"ElastiCache nodes", value:summary.ec_nodes },
//         { label:"ElastiCache SG", value:summary.ec_security_groups },
//         { label:"EBS Volumes", value:summary.ebs_volumes },
//         { label:"EBS Snapshots", value:summary.ebs_snapshots },
//         { label:"My IP", value: summary.my_ip }
//     ] })
// }, 5 * 1000);


// LONG CRON JOB, every x minutes

// var ec2_points = [];
// for (var i = 1; i <= 10; i++) {         // init EC2 graph
//     ec2_points.push({x: i, y: i});
// }
// var ec2_last_x = ec2_points[ec2_points.length - 1].x;

// new CronJob(config.LONG_JOB_INTERVAL, function(){
//
//     console.log('running long cron job at: ' + new Date());
//
//     aws_service.getEC2Instances(function(err, ec2_instances){
//         if (!err) {
//             ec2_points.shift();
//             ec2_points.push({x: ++ec2_last_x, y: ec2_instances.length});
//             send_event('ec2_graph', {points: ec2_points});
//         }
//     });
//
// }, null, true, null);


// DAILY CRON JOB

// new CronJob(config.DAILY_JOB_INTERVAL, function(){
//
//     console.log('running daily cron job at: ' + new Date());
//
//     aws_service.getS3Buckets(function(err, s3_buckets){
//         if (!err) {
//             summary.s3_objects = 0;
//             var s3_objects = 0;
//             async.each(s3_buckets, function(bucket, callback){
//                 aws_service.getS3Objects(bucket.Name, function(err, objects){
//                     if (!err) {
//                         s3_objects += objects;
//                         callback()
//                     }
//                 });
//             }, function(err){
//                 if (!err) {
//                     summary.s3_objects = s3_objects;
//                     send_event('s3_objects', {text: summary.s3_objects});
//                 }
//             });
//         }
//     });
// }, null, true, null);
