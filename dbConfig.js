const dbConfig = {
    user: "usr_interface",
    password: "JUK321pak",
    database: "CAC",
    server:"SFL-TEST",
    pool:{
        max:10,
        min:0
            },
    options: {
        trustServerCertificate: true,
        encrypted: false

    }
};

module.exports = dbConfig;