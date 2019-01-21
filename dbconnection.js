function dbConnection(){
  const mysql = require('mysql');
  const db = mysql.createConnection({
    host      :'remotemysql.com',
    port      : 3306,
    user      :'ifoizoJSTs',
    password  :'GBGE4ViPE4',
    database  :'ifoizoJSTs'
  });
  db.connect(function(err){
    if(err){
      throw err;
    }
    console.log('Mysql Connected');
  });
  return db;
}
  module.exports = dbConnection;

