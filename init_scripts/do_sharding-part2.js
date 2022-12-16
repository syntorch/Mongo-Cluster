use ddbs
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
