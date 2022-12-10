rs.initiate({
    _id: "cfg1", 
    configsvr: true, 
    version: 1, 
    members: [{ _id: 0, host : 'cfg1:27017' }] 
})
