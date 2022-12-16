// this script contins all mongo shell commands required to populate and shard collections for this project

// enable sharding for database

//I have some data where it shouldn't be

use ddbs
// db.adminCommand( { movePrimary : "ddbs", to : "shard_for_init1" } )
sh.enableSharding("ddbs")

//----------------- shard user
db.user.createIndex({"region": 1, "uid": 1})
sh.shardCollection("ddbs.user", {"region": 1, "uid": 1})
sh.disableBalancing("ddbs.user")
sh.addShardTag("dbms1", "BJ")
sh.addTagRange(
    "ddbs.user",
    {"region": "Beijing", "uid": MinKey},
    {"region": "Beijing", "uid": MaxKey},
    "BJ"
)
sh.addShardTag("dbms2", "HK")
sh.addTagRange(
    "ddbs.user",
    {"region": "Hong Kong", "uid": MinKey},
    {"region": "Hong Kong", "uid": MaxKey},
    "HK"
)
sh.enableBalancing("ddbs.user")

// -----------------shard article
db.article.createIndex({"category": 1, "aid": 1})
sh.shardCollection("ddbs.article", {"category": 1, "aid": 1})
sh.disableBalancing("ddbs.article")
sh.addShardTag("dbms1", "DBMS")
sh.addShardTag("dbms2", "DBMS")

sh.addTagRange(
            "ddbs.article",
            {"category": "science", "aid": MinKey},
            {"category": "science", "aid": MaxKey},
            "DBMS"
        )
sh.addShardTag("dbms2", "TECH")
sh.addTagRange(
            "ddbs.article",
            {"category": "technology", "aid": MinKey},
            {"category": "technology", "aid": MaxKey},
            "TECH"
        )
sh.enableBalancing("ddbs.article")

// ------------------- shard read 
// add region and category column to read
db.user.aggregate([
    { $project: {uid:1, region: 1}},
    { $out: "uid_reg"}
])
db.read.aggregate([
        { $lookup: {from: "uid_reg", localField: "uid", foreignField: "uid", as: "someField"}},
        { $addFields: { region: "$someField.region"}},
        { $unwind: "$region"},
        { $project: { someField: 0}},
        { $out: "read"}
    ],
    { allowDiskUse: true }
    )
db.article.aggregate([
    { $project: {aid:1, category: 1, timestamp: 1}},
    { $out: "aid_cat_ts"}
    ])
db.read.aggregate([
    { $lookup: {from: "aid_cat_ts", localField: "aid", foreignField: "aid", as: "someField"}},
    { $addFields: { category: "$someField.category", article_ts: "$someField.timestamp"}},
    { $unwind: "$category"},
    { $unwind: "$article_ts"},
    { $project: { someField: 0}},
    { $out: "read"}
],
{ allowDiskUse: true }
)
//sharding
db.read.createIndex({"region": 1, "id": 1})
sh.shardCollection("ddbs.read", {"region": 1, "id": 1})
sh.disableBalancing("ddbs.read")
sh.addShardTag("dbms1", "BJ")
sh.addTagRange(
    "ddbs.read",
    {"region": "Beijing", "id": MinKey},
    {"region": "Beijing", "id": MaxKey},
    "BJ"
)
sh.addShardTag("dbms2", "HK")
sh.addTagRange(
    "ddbs.read",
    {"region": "Hong Kong", "id": MinKey},
    {"region": "Hong Kong", "id": MaxKey},
    "HK"
)
sh.enableBalancing("ddbs.read")

// --------------- populate beread
db.read.aggregate(
    [
        // group by aid and create new fields with aggregated counts and arrays
        {
            $group: {
                _id: "$aid",
                category: { $first: "$category" },
                timestamp: { $first: "$timestamp" },
                readNum: { $sum: { $cond: { if: { $gt: [{$toInt: "$readTimeLength"},0] }, then: 1, else: 0} } },
                readUidList: { $addToSet: { $cond: { if: { $gt: [{$toInt: "$readTimeLength"},0] }, then:  "$uid", else: "$$REMOVE"} } },
                commentNum: { $sum: {$toInt: "$commentOrNot" } },
                commentUidList: { $addToSet: { $cond: { if: { $eq: ["$commentOrNot","1"] }, then: "$uid", else: "$$REMOVE"} } },
                agreeNum: { $sum: {$toInt: "$agreeOrNot" } },
                agreeUidList: { $addToSet: { $cond: { if: { $eq: ["$agreeOrNot","1"] }, then: "$uid", else: "$$REMOVE"} } },
                shareNum: { $sum: {$toInt: "$shareOrNot" } },
                shareUidList: { $addToSet: { $cond: { if: { $eq: ["$shareOrNot","1"] }, then: "$uid", else: "$$REMOVE"} } },
            }
        },
        { $addFields: { "aid": "$_id"}},


        { $out: "beread"}
    ],
    { allowDiskUse: true }
)

// Sharding

//sharding
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


//sharding popRank

db.popRank.createIndex({temporalGranularity: 1, "_id": 1})
sh.shardCollection("ddbs.popRank", {temporalGranularity: 1, "_id": 1})
sh.disableBalancing("ddbs.popRank")
sh.addShardTag("dbms1", "DAILY")
sh.addShardTag("dbms2", "WEEKLY OR MONTHLY")

sh.addTagRange(
        "ddbs.popRank",
        {temporalGranularity: 'daily', "_id": MinKey},
        {temporalGranularity: 'daily', "_id": MaxKey},
        "DAILY"
    )
sh.addTagRange(
    "ddbs.popRank",
    {temporalGranularity: 'weekly', "_id": MinKey},
    {temporalGranularity: 'weekly', "_id": MaxKey},
    "WEEKLY OR MONTHLY"
)

sh.addTagRange(
    "ddbs.popRank",
    {temporalGranularity: 'monthly', "_id": MinKey},
    {temporalGranularity: 'monthly', "_id": MaxKey},
    "WEEKLY OR MONTHLY"
)

sh.enableBalancing("ddbs.popRank")

//populate beread
//why I have twice more data in the shards