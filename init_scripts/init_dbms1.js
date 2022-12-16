rs.initiate({
    _id: "dbms1", 
    members: [
        { _id: 0, host: "dbms1-svr1:27017"},
        { _id: 1, host: "dbms1-svr2:27017"}
    ]
})