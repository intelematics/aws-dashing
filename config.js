module.exports = {
    ENV: process.env.NODE_ENV || 'development',
    JOB_INTERVAL: "*/5 * * * * *",
    LONG_JOB_INTERVAL:  "0 */30 * * * *",
    DAILY_JOB_INTERVAL: "0 0 00 * * *",
    AWS: {
        ACCESSKEY: process.env.AWS_ACCESS_KEY_ID,
        SECRETKEY: process.env.AWS_SECRET_ACCESS_KEY,
        REGION: process.env.AWS_REGION || 'ap-southeast-2'
    },
    AWS_LIMITS: {
        RDS: "40",
        ELB: "80",
        ELASTICACHEINSTANCE: "20"
    }
}
