'use strict'
var expressApp = require('express'),
app = expressApp(),
enginesApp = require('consolidate'),
bodyParserApp = require('body-parser'),
assertApp = require('assert'),
momentApp = require('moment'),
pathApp = require('path'),
MongoSApp = require('./modules/MongoDB');
require('dotenv').load();
var uriApp = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;            
var serverApp;
serverApp = new MongoSApp(uriApp);



const requestApp = require('superagent');

class App {
    constructor() {
        return this;
    }
    superagent(url,callback) {
        requestApp.get(url, function(err, res){
            if (err) throw err;
            //console.log(res.text);
            //console.log(res);
            callback(res.text);
        });
    }
    main(callback) {
        app.use(expressApp.static(pathApp.join(__dirname + '/public')));
        
        app.set('view engine', 'html');
        app.set('views', __dirname + '/views');
        app.engine('html', enginesApp.nunjucks);
        app.use(bodyParserApp.urlencoded({ extended: true })); 
        
        
        // Handler for internal server errors
        function errorHandler(err, req, res, next) {
            console.error(err.message);
            console.error(err.stack);
            res.status(500).render('./client/views/error_template', { error: err });
        }
        function getRandomInt(min, max) {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
        }
        app.use(errorHandler);

        app.get('/helloWorld', function(req,res, next){
            res.send("Hello World");
            res.send(next);
        });
        app.get('/', function(req,res,next){
            res.render('add_dataPoint', {'randomInt':getRandomInt(0,5500)});
        });
        app.post('/add_dataPoint', function(req, res, next) {
            var sensor = req.body.sensor.toString();
            var value = req.body.value;
            const Sensor = {
                sensor:sensor,
            };
            Sensor.limit = parseInt(req.body.limit,10) || 20;
            var time = momentApp.utc(new Date()).format("YYYY-MM-DD HH:mm Z");
            console.log(time);

            var iSensor = {
                sensor:sensor,
                value:value,
                time:time
            }
            serverApp.insertSensor(iSensor,callback);
            function callback(){
                serverApp.mongoDataGrabSensorArray(Sensor, callback2);
            }
            var sensorArray = [];
            function callback2(cursor){
                var count = 0;
                cursor.forEach(sensor => {
                    count=count+1;
                    sensor.time= momentApp(new Date(sensor.time), "YYYY-MM-DD HH:mm Z");
                    sensorArray.push(sensor);
                    console.log(sensor);
                },function(err){
                    console.log("Retrieved: ", count,Sensor.sensor+" sensors");
                    
                    var docs = sensorArray;
                    res.render('../public/sensor.html', { 'points' : docs, 'value': value});
                });
            }
            
        }); 
       
        app.get('/public/scripts/DrawLineGraph.js',function(req,res,next){
            console.log("sent JS file.");
            res.sendFile(pathApp.resolve(__dirname + "/public/scripts/DrawLineGraph.js"));
            
        });
        app.get('/public/scripts/example.js',function(req,res,next){
            console.log("sent JS file.");
            res.sendFile(pathApp.resolve(__dirname + "/public/scripts/example.js"));
            
        });
        callback(app)
        }
    }

module.exports = App;