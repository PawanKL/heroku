var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var session = require('express-session');
// var mysql = require('mysql');
const port = process.env.PORT || 3000;


// Create Connection
// const db = mysql.createConnection({
//   host      :'localhost',
//   user      :'root',
//   password  :'',
//   database  :'sampledb'
// });

// db.connect(function(err){
//     if(err){
//       throw err;
//     }
//     console.log('Mysql Connected');
// });


var app =  express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({extended: true}));
const dbConnection = require('./dbconnection.js');


app.use(session(
  {
      secret: "Hello World",
      resave: false,
      saveUninitialized: false,
  }
));


app.use(function(req, res, next){
  res.locals.currentUser = req.session.username;
  res.locals.userError = null;
  next();
});

const db = dbConnection();
app.get('/test', function(req, res){
  db.query('SELECT * FROM Person', function(err, result){
    if(err){
      throw err;
    }
    return res.send(result[0]);
  });
});

app.get('/', function(req, res){
  // if(req.session.username){
  //   return res.redir
  // }
    res.render('index');
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  username = req.body.username;
  password = req.body.password;
  // console.log(username);
  var data;
  let sql = 'SELECT * FROM User Where username = ? AND password = ?';
  db.query(sql, [username, password], function(err, result, fields){
      // if(err){
      //     throw err;
      //     return res.redirect('/login');
      // }
      if(result.length > 0){
          data = result[0];
          // console.log(data);
          req.session.username = data.username;
          // console.log(req.session.username);
          return res.redirect('/user');
      }
      res.locals.userError = "Database Error";
      return res.render('login');
      
  });
  return;
     
});

app.get('/addClient', function(req, res){
  if(req.session.username){
    return res.render('addClient');
  }   
  return res.redirect('/login');
});

app.post('/addClient', function(req, res){


  if(req.session.username){
      var accountName = req.body.accountName;
      var Contact_NO = req.body.Contact_NO;
      var Currency = req.body.Currency;
      let sql = 'Insert into Client (accountName, Contact_NO, Currency) Values(?, ?, ?)';

      db.query(sql, [accountName, Contact_NO, Currency], function(err, result){
        if(err){
          throw err;
        }
        return res.redirect('/user');
      });
    return;
  }
  return res.redirect('/login');
});

app.get('/logout', function(req, res){
  req.session.destroy();
  res.redirect('/');
});

app.get('/user', function(req, res){
  if(req.session.username){
    return res.render('user');
  }
   return res.redirect('/login'); 
});

app.get('/deposit', function(req, res){
  if(req.session.username){
    return res.render('deposit');
  }
  return res.redirect('/login');
});
app.post('/deposit',function(req, res){
  if(req.session.username){
    let sql = 'select * from client where accountName=?';
    let amount = 0, newAmount = 0;
    db.query(sql,[req.body.accountName], function(err, result){
      if(err){
        throw err;
      }
      amount = parseInt(result[0].Amount);
      console.log(amount);
      newAmount = amount + parseInt(req.body.amount);
      console.log(newAmount);
      sql = 'update Client Set Amount=? Where accountName=?';
      db.query(sql, [newAmount, req.body.accountName], function(err, output){
          if(err){
            throw err;
          }
          return;
      });
      console.log("Hello");
      var data = {

        date: null,
        accountName: req.body.accountName,
        debit: 0,
        credit: parseInt(req.body.amount),
        balance: newAmount,
        nar: req.body.nar,
      }
      data.date = new Date().toLocaleDateString().split(' ')[0];
      sql = 'insert into Transaction (accountName, Narration, date, debit, credit, balance) Values(?, ?, ?, ?, ?, ?)';
      db.query(sql, [data.accountName, data.nar, data.date, data.debit, data.credit, data.balance], function(err,result2){
        if(err){
          throw err;
        }
        return;
      });
    });
    return res.redirect('/user');
  }
  return res.redirect('/login');
});

app.get('/withdraw', function(req, res){
  res.render('withdraw.ejs');
});

app.post('/withdraw',function(req, res){
  if(req.session.username){
    let sql = 'select * from client where accountName=?';
    let amount = 0, newAmount = 0;
    db.query(sql,[req.body.accountName], function(err, result){
      if(err){
        throw err;
      }
      amount = parseInt(result[0].Amount);
      console.log(amount);
      newAmount = amount - parseInt(req.body.amount);
      console.log(newAmount);
      sql = 'update Client Set Amount=? Where accountName=?';
      db.query(sql, [newAmount, req.body.accountName], function(err, output){
          if(err){
            throw err;
          }
          return;
      });
      console.log("Hello");
      var data = {

        date: null,
        accountName: req.body.accountName,
        debit: parseInt(req.body.amount),
        credit: 0,
        balance: newAmount,
        nar: req.body.nar,
      }
      data.date = new Date().toLocaleDateString().split(' ')[0];
      sql = 'insert into Transaction (accountName, Narration, date, debit, credit, balance) Values(?, ?, ?, ?, ?, ?)';
      db.query(sql, [data.accountName, data.nar, data.date, data.debit, data.credit, data.balance], function(err,result2){
        if(err){
          throw err;
        }
        return;
      });
    });
    return res.redirect('/user');
  }
  return res.redirect('/login');
});

app.get('/clientStatement', function(req, res){
  if(req.session.username){
    console.log(req.query);
    var name=req.query.name, fromDate=req.query.from, toDate=req.query.to;
     let sql = 'select * from Transaction Where (accountName=?) AND (date Between ? AND ? )';
    db.query(sql,[name,fromDate,toDate], function(err, result){
      if(err){
        throw err;
      }
      // console.log(result);
      var data = result;
      console.log(data);
      return res.render('clientStatement', {data: data, inputData: req.query});
      // return res.render('clientStatement.ejs', {data: data});
    });
    // return;
    // return res.render('clientStatement');
    return;
  }
  return res.redirect('/login');
});

app.get('/results', function(req, res){
  res.send(req.query);
});

app.get('/check', function(req, res){
  console.log(new Date());
  console.log(new Date().toLocaleDateString().split(' ')[0]);
  res.render('search.ejs');
});



// app.get('/show',function(req,res){
//     let sql = 'SELECT * From sample';
//     db.query(sql, function(err, result){
//         if(err){
//           throw err;
//         }
//         res.render('index',{result:result});

//     });
// });

app.get('/clientInfo', function(req, res){
  if(req.session.username){
    let sql = 'Select * From Client';
    db.query(sql, function(err, result){
      if(err){
        throw err;
      }
      var data = result;
      return res.render('clientsInfo', {data: data});
    });
    return;
  } 
  return res.redirect('/login');
});
  

function getAmount(amount){
  return amount;
}
app.listen(port, function(){
  // console.log(process.env.PORT);
  console.log('sever is Running on ' + toString(process.env.IP));
});