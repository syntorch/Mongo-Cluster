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


