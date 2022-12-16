//sharding popRank
use ddbs
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