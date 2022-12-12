rs.initiate({
    _id: "shard_for_init1", 
    members: [{ _id: 0, host: "shard_for_init1:27017"}]
})