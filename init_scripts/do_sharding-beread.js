//sharding
use ddbs
db.beread.createIndex({"category": 1, "aid": 1})
sh.shardCollection("ddbs.beread", {"category": 1, "aid": 1})
sh.disableBalancing("ddbs.beread")
sh.addShardTag("dbms1", "DBMS")
sh.addShardTag("dbms2", "DBMS")

sh.addTagRange(
            "ddbs.beread",
            {"category": "science", "aid": MinKey},
            {"category": "science", "aid": MaxKey},
            "DBMS"
        )
sh.addShardTag("dbms2", "TECH")

sh.addTagRange(
            "ddbs.beread",
            {"category": "technology", "aid": MinKey},
            {"category": "technology", "aid": MaxKey},
            "TECH"
        )
sh.enableBalancing("ddbs.beread")

// -------------------popRank
//popRankMth
db.read.aggregate([
    // project relevant fields from db.read
    { $project: { date: {"$toDate": {"$toLong": "$timestamp"}}, aid: 1, readTimeLength: 1, agreeOrNot: 1, commentOrNot: 1, shareOrNot: 1} },

    // add year and month fields
    { $addFields: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        popScore: {$sum: [{ if: { $gt: [{$toInt: "$readTimeLength"},0] }, then: 1, else: 0}, {$toInt: "$agreeOrNot"}, {$toInt: "$commentOrNot"}, {$toInt: "$shareOrNot"}]}}
    },

    // add unix timestamp defined only by yr and mth
    { $addFields: { timestamp: { $subtract: [ { $dateFromParts: { 'year' : "$year", 'month' : "$month"} }, new Date("1970-01-01") ] }}},

    // Group by year, month, aid and compute popularity score
    {
        $group: {
            _id: { "timestamp": "$timestamp", "aid": "$aid"},
            popScoreAgg: { $sum: "$popScore" }
        }
    },

    // sort by popScore each month
    { $sort: {"_id.timestamp": 1, "popScoreAgg": -1} },

    // store all articles in sorted order in array for each month
    {
        $group: {
            _id: "$_id.timestamp",
            articleAidList: {$push: "$_id.aid"}
        }
    },

    // keep only top five articles in array
    { 
        $project: { 
            _id: {$concat: ["m", { $toString: "$_id" }]}, 
            timestamp: "$_id", 
            articleAidList: { $slice: ["$articleAidList", 5]},
            temporalGranularity: "monthly"
            }
    },

    // output
    {"$out": "popRankMth"}
],
{ allowDiskUse: true })

//popRankWk
db.read.aggregate([
        // project relevant fields from db.read
        { $project: { date: {"$toDate": {"$toLong": "$timestamp"}}, aid: 1, readTimeLength: 1, agreeOrNot: 1, commentOrNot: 1, shareOrNot: 1} },

        // add year and month fields
        { $addFields: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            week: {$week: "$date"},
            popScore: {$sum: [{ if: { $gt: [{$toInt: "$readTimeLength"},0] }, then: 1, else: 0}, {$toInt: "$agreeOrNot"}, {$toInt: "$commentOrNot"}, {$toInt: "$shareOrNot"}]}}
        },

        // add unix timestamp defined only by yr and mth
        { $addFields: { timestamp: { $subtract: [ { $dateFromParts: { 'isoWeekYear' : "$year", 'isoWeek' : "$week"} }, new Date("1970-01-01") ] }}},

        // Group by year, month, aid and compute popularity score
        {
            $group: {
                _id: { "timestamp": "$timestamp", "aid": "$aid"},
                popScoreAgg: { $sum: "$popScore" }
            }
        },

        // sort by popScore each month
        { $sort: {"_id.timestamp": 1, "popScoreAgg": -1} },

        // store all articles in sorted order in array for each month
        {
            $group: {
                _id: "$_id.timestamp",
                articleAidList: {$push: "$_id.aid"}
            }
        },

        // keep only top five articles in array
        { 
            $project: { 
                _id: {$concat: ["w", { $toString: "$_id" }]}, 
                timestamp: "$_id", 
                articleAidList: { $slice: ["$articleAidList", 5]},
                temporalGranularity: "weekly"
                }
        },

        // output
        {"$out": "popRankWk"}
    ],
    { allowDiskUse: true })
//popRankDay
db.read.aggregate([
    // project relevant fields from db.read
    { $project: { date: {"$toDate": {"$toLong": "$timestamp"}}, aid: 1, readTimeLength: 1, agreeOrNot: 1, commentOrNot: 1, shareOrNot: 1} },

    // add year and month fields
    { $addFields: {
        year: { $year: "$date" },
        month: { $month: "$date" },
        day: {$dayOfYear: "$date" },
        popScore: {$sum: [{ if: { $gt: [{$toInt: "$readTimeLength"},0] }, then: 1, else: 0}, {$toInt: "$agreeOrNot"}, {$toInt: "$commentOrNot"}, {$toInt: "$shareOrNot"}]}}
    },

    // add unix timestamp defined only by yr and mth
    { $addFields: { timestamp: { $subtract: [ { $dateFromParts: { 'year' : "$year", 'month' : "$month", 'day': "$day"} }, new Date("1970-01-01") ] }}},

    // Group by year, month, aid and compute popularity score
    {
        $group: {
            _id: { "timestamp": "$timestamp", "aid": "$aid"},
            popScoreAgg: { $sum: "$popScore" }
        }
    },

    // sort by popScore each month
    { $sort: {"_id.timestamp": 1, "popScoreAgg": -1} },

    // store all articles in sorted order in array for each month
    {
        $group: {
            _id: "$_id.timestamp",
            articleAidList: {$push: "$_id.aid"}
        }
    },

    // keep only top five articles in array
    { 
        $project: { 
            _id: {$concat: ["d", { $toString: "$_id" }]}, 
            timestamp: "$_id", 
            articleAidList: { $slice: ["$articleAidList", 5]},
            temporalGranularity: "daily"
            }
    },

    // output
    {"$out": "popRankDay"}
],
{ allowDiskUse: true })

//combine into popRank
db.popRankMth.find().forEach( function(doc) { db.popRank.insert(doc) })
db.popRankWk.find().forEach( function(doc) { db.popRank.insert(doc) })
db.popRankDay.find().forEach( function(doc) { db.popRank.insert(doc) })
db.popRank.aggregate([ {$sort: {timestamp:1}}, {$out: "popRank"} ])


