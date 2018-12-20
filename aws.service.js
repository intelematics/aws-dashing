var AWS = require('aws-sdk');
var config = require('./config');
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


// aws services declarations
var ec2 = new AWS.EC2();
var elb = new AWS.ELB();
var s3 = new AWS.S3();
var rds = new AWS.RDS();
var elasticache = new AWS.ElastiCache();
var route53 = new AWS.Route53();
var guardduty = new AWS.GuardDuty();

// query the aws api and expose methods for jobs
module.exports = {

    /// EC2 ///

    getEC2InstanceLimit: function (next) {
        ec2.describeAccountAttributes(function(err, data){
            if (err) return next(err, null);
            data.AccountAttributes.forEach(function(attr){
                if (attr.AttributeName === "max-instances") {
                    next(null, attr.AttributeValues[0].AttributeValue);
                }
            });
        });
    },

    getEC2Instances: function (next){
        ec2.describeInstances(function(err, data){
            if (err) return next(err, null);
            next(null, data.Reservations);
        });
    },

    getElasticIPsLimit: function (next) {
        ec2.describeAccountAttributes(function(err, data){
            if (err) return next(err, null);
            data.AccountAttributes.forEach(function(attr){
                if (attr.AttributeName === "max-elastic-ips") {
                    next(null, attr.AttributeValues[0].AttributeValue);
                }
            });
        });
    },

    getElasticIPs: function (next) {
        ec2.describeAddresses(function(err, data) {
            if (err) return next(err, null);
            next(null, data.Addresses);
        });
    },

    getSecurityGroups: function (next) {
        ec2.describeSecurityGroups(function(err, data) {
            if (err) return next(err, null);
            next(null, data.SecurityGroups);
        });
    },

    // EBS //

    getEBSVolumes: function (next) {
        ec2.describeVolumes(function(err, data){
            if (err) return next(err, null);
            next(null, data.Volumes);
        });
    },

    getEBSSnapshots: function (next) {
        ec2.describeSnapshots(function (err, data) {
            if (err) return next(err, null);
            next(null, data.Snapshots);
        });
    },

    /// ELB ///

    getELBs: function (next) {
        elb.describeLoadBalancers(function(err, data) {
            if (err) return next(err, null);
            next(null, data.LoadBalancerDescriptions);
        });
    },

    /// S3 ///

    getS3Buckets: function (next) {
        s3.listBuckets(function(err, data) {
            if (err) return next(err, null);
            next(null, data.Buckets);
        });
    },

    getS3Objects: function (bucket_name, next) {
        var listS3Objects = function (bucket_name, index, objects, next) {
            s3.listObjects({Bucket:bucket_name, Marker:index}, function (err, data) {
                if (err) return next(err, null);
                var length = data.Contents.length
                objects += length;
                if (data.IsTruncated == true){
                    listS3Objects(bucket_name, data.Contents[length-1].Key, objects, next);
                } else {
                    next(null, objects);
                }
            })
        };
        listS3Objects(bucket_name, "", 0, next);
    },

    /// RDS ///

    getRDSInstances: function (next) {
        rds.describeDBInstances(function(err, data) {
            if (err) return next(err, null);
            next(null, data.DBInstances);
        });
    },

    /// ElastiCache ///

    getElastiCacheClusters: function (next) {
        elasticache.describeCacheClusters(function (err, data) {
            if (err) return next(err, null);
            next(null, data.CacheClusters);
        });
    },

    getElastiCacheNodes: function (next) {
        elasticache.describeReservedCacheNodes(function(err, data) {
            if (err) return next(err, null);
            next(null, data.ReservedCacheNodes);
        });
    },

    getElastiCacheSecurityGroups: function (next) {
        elasticache.describeCacheSecurityGroups(function (err, data) {
            if (err) return next(err, null);
            next(null, data.CacheSecurityGroups);
        });
    },

    /// R53 ///

    getR53HostedZones: function (next) {
        route53.listHostedZones(function(err, data) {
            if (err) return next(err, null);
            next(null, data.HostedZones);
        });
    },

    getR53RecordsSet: function (hosted_zones_id, next) {
        route53.listResourceRecordSets({HostedZoneId: hosted_zones_id}, function (err, data){
            if (err) return next(err, null);
            next(null, data.ResourceRecordSets);
        });
    },

    /// Guard Duty ///

    getGDDetectors: function(next) {
        var listDetectors = Q.nbind(guardduty.listDetectors, guardduty);
        listDetectors().then(function(data) {
            next(null, data.DetectorIds);
        });
    },

    getGDFindingsCount: function(detector_id, next, NextToken, count) {
        var count = count ? count : 0;

        var listFindings = Q.nbind(guardduty.listFindings, guardduty);
        var d = listFindings({DetectorId: detector_id});
        var params = {
            DetectorId      : detector_id,
            FindingCriteria : {"Criterion": {"service.archived": {"Eq": ["false"]}}},
            NextToken       : NextToken
        };

        listFindings(params)
        .then(function(data) {
                count += data.FindingIds.length;
                if(data.NextToken) {
                    module.exports.getGDFindingsCount(detector_id, next, data.NextToken, count);
                }
                else {
                    return next(null, count);
                }
            })
            .fail(function(err) {
                console.log(err);
            });
    }
}
