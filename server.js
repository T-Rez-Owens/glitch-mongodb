var express = require('express'),
    app = express(),
    engines = require('consolidate'),
    bodyParser = require('body-parser'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    moment = require('moment');


app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true })); 

// Handler for internal server errors
function errorHandler(err, req, res, next) {
    console.error(err.message);
    console.error(err.stack);
    res.status(500).render('error_template', { error: err });
}

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;


MongoClient.connect(uri, function(err, db) {

    assert.equal(null, err);
    console.log("Successfully connected to /%s.", uri);

    app.get('/', function(req, res, next) {
        res.render('add_dataPoint', {});
    });
    
    
    app.post('/add_dataPoint', function(req, res, next) {
        var sensor = req.body.sensor;
        var value = req.body.value;
        var date = new Date();
        var time = moment().format('llll');

        if ((sensor == '') || (value == '') ) {
            next('Please provide an entry for all fields.');
        } else {
            db.collection('points').insertOne(
                { 'sensor': sensor, 'value': value, 'time': time },
                function (err) {
                    assert.equal(null, err);
                    db.collection('points').find({'sensor':sensor}).toArray(function(err,docs){
                      res.render('sensor', { 'points' : docs, 'value': value});
                    });
                }
            );
        }
    });
    
    app.use(errorHandler);
    
    var server = app.listen(3000, function() {
        var port = server.address().port;
        console.log('Express server listening on port %s.', port);
    });
    
});
