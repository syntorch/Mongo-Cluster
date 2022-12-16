rs.initiate({
    _id: "dbms2", 
    members: [
        { _id: 0, host: "dbms2-svr1:27017"},
        { _id: 1, host: "dbms2-svr2:27017"}
    ]
})