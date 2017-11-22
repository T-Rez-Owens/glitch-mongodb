'use strict'
var express = require('express'),
app = express(),
engines = require('consolidate'),
bodyParser = require('body-parser'),
assert = require('assert'),
moment = require('moment'),
path = require('path'),
MongoS = require('./modules/MongoDB');
require('dotenv').load();
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;            
var server;
server = new MongoS(uri);



const request = require('superagent');

class App {
    constructor() {
        return this;
    }
    superagent(url,callback) {
        request.get(url, function(err, res){
            if (err) throw err;
            //console.log(res.text);
            //console.log(res);
            callback(res.text);
        });
    }
    main(callback) {
        app.use(express.static(path.join(__dirname + '/public')));
        
        app.set('view engine', 'html');
        app.set('views', __dirname + '/views');
        app.engine('html', engines.nunjucks);
        app.use(bodyParser.urlencoded({ extended: true })); 
        
        
        // Handler for internal server errors
        function errorHandler(err, req, res, next) {
            console.error(err.message);
            console.error(err.stack);
            res.status(500).render('./client/views/error_template', { error: err });
        }
        
        app.use(errorHandler);

        app.get('/helloWorld', function(req,res, next){
            res.send("Hello World");
            res.send(next);
        });
        app.get('/', function(req,res,next){
            res.render('add_dataPoint', {});
        });
        app.post('/add_dataPoint', function(req, res, next) {
            var sensor = req.body.sensor.toString();
            var value = req.body.value;
            const Sensor = {
                sensor:sensor
            };
            var date = new Date();
            var time = moment().format('llll');
            var iSensor = {
                sensor:sensor,
                value:value,
                time:time
            }
            server.insertSensor(iSensor,callback);
            function callback(){
                server.mongoDataGrabSensorArray(Sensor, callback2);
            }
            var sensorArray = [];
            function callback2(cursor){
                var count = 0;
                cursor.forEach(sensor => {
                    count=count+1;
                    sensorArray.push(sensor);
                    //console.log(sensor);
                },function(err){
                    console.log("Found: ",count,Sensor.sensor+" sensors");
                    
                    var docs = sensorArray;
                    res.render('../public/sensor.html', { 'points' : docs, 'value': value});
                });
            }
            
        }); 
       
        app.get('/public/scripts/DrawLineGraph.js',function(req,res,next){
            console.log("sent JS file.");
            res.sendFile(path.resolve(__dirname + "/public/scripts/DrawLineGraph.js"));
            
        });
        app.get('/public/scripts/example.js',function(req,res,next){
            console.log("sent JS file.");
            res.sendFile(path.resolve(__dirname + "/public/scripts/example.js"));
            
        });
        callback(app)
        }
    }

module.exports = App;