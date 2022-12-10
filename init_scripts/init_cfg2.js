rs.initiate({
    _id: "cfg2", 
    configsvr: true, 
    version: 1, 
    members: [{ _id: 0, host : 'cfg2:27017' }] 
})
