var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var connect = require('connect');
var session = require('express-session');
// var MongoStore = require('connect-mongodb');
var MongoStore = require('connect-mongo')(session);


var bodyParser = require('body-parser');

//var MongoStore = require('connect-mongo')(express);
var settings = require('./settings');
var flash = require('connect-flash');



// var users = require('./routes/users');
// var test = require('./routes/test');
// var nav = require('./routes/nav');

var app = express();





// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');
app.use(flash());

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// app.use(connect.multipart());
//app.use(bodyParser({keepExtensions: true, uploadDir: './public/images'}));
app.use(require('connect-multiparty')());  // 文件上传

app.use(cookieParser());
/*app.use(session({ 
    secret: 'keyboard cat', 
    key: 'sid', 
    cookie: { 
        secure: true,
        maxAge: 60000
    },
    store: new MongoStore({
        db: settings.db,
        host: settings.host
    })
}));*/

app.use(session({
    secret: settings.cookieSecret,
    store: new MongoStore({
        db : settings.db
    })
}));

app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));




var routes = require('./routes/index');
app.use('/', routes);
// app.use('/', routes);
// app.use('/users', users);
// app.use('/test', test);
// app.use('/nav', nav);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            title: 'error',
            message: err.message,
            error: err,
            user: undefined,
            success: false
        });
        console.log(err);
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        title: 'error',
        message: err.message,
        error: {},
        user: undefined,
        success: false
    });
    console.log(err);
});


module.exports = app;
