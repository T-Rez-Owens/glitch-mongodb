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
var XLSX = require('XLSX');
console.log(process.env.SYSTEM);


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
            res.render('../public/home');
        });
        app.get('/view_dataPoint', function(req,res,next){
            res.render('../public/viewData');
        });
        app.post('/view_dataPoint', function(req, res, next) {
            var sensor = req.body.sensor.toString();
            var query1 = new Date(req.body.query1);
            console.log(query1);
            var query2 = new Date(req.body.query2);
            console.log(query2);
            
            const Sensor = {
                sensor:sensor,
            };
            Sensor.limit = parseInt(req.body.limit,10) || 20;
            //var time = momentApp.utc(new Date()).format("YYYY-MM-DD HH:mm Z");
            //console.log(time);

            var iSensor = {
                sensor:sensor
            };
            var sensorArray = [];
            serverApp.mongoDataGrabSensorArray(Sensor, callback2);
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
                    res.render('../public/sensor.html', { 'points' : docs});
                });
            }
            
        }); 
        app.get('/add_dataPoint', function(req,res,next){
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
        app.get('/schedule',function(req, res, next){
            if(typeof require !== 'undefined') XLSX = require('xlsx');
            var fileString = "";
            if(process.env.SYSTEM == 'local'){
                fileString = '\\\\OFS1\\SHARED\\USERS\\MFG\\SHARED\\Chairs Powder Coating\\PC SCHEDULE 2017.xlsx';
            }
            else{
                fileString = pathApp.resolve(__dirname + "/public/sample/sampleSchedule.xlsx");
            }
            
            var workbook = XLSX.readFile(fileString);
            var date = momentApp(new Date());
            //console.log(parseInt(req.query.dow));
            var dow = parseInt(req.query.dow) || date.day();//since dow is not going to be 0 for sunday this works. if I wanted to use sunday I'd have to re-think this logic.
            //console.log(dow);
            var dowA = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
            switch(dow){
                case 0://SUNDAY
                    //spend this time well!
                break;
                case 6://SATURDAY
                    console.log("enjoy your weekend!");
                break;
                default:
                    var dowToday = dowA[dow];
                    console.log(dowToday);
            }
            
            /* DO SOMETHING WITH workbook HERE */
            var first_sheet_name = workbook.SheetNames[0];
            var address_of_cell = 'G3';
             
            /* Get worksheet */
            var ws = workbook.Sheets[dowToday];
             
            /* Find desired cell */
            var desired_cell = ws[address_of_cell];
            var desired_range;
            //console.log(ws['!ref']);
            /* Get the value */

            var desired_value = (desired_cell ? desired_cell.v : undefined);
            var sheet2arr = function(sheet, range2Arr){
                var result = [];
                var row;
                var rowNum;
                var colNum;
                var range = XLSX.utils.decode_range(range2Arr);
                for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
                   row = [];
                    for(colNum=range.s.c; colNum<=range.e.c; colNum++){
                       var nextCell = sheet[
                          XLSX.utils.encode_cell({r: rowNum, c: colNum})
                       ];
                       if( typeof nextCell === 'undefined' ){
                          row.push(void 0);
                       } else row.push(nextCell.w);
                    }
                    result.push(row);
                }
                return result;
                
             };
            var vA = sheet2arr(ws,'G3:G12');
            var pA = sheet2arr(ws,'F3:F12');
            
            //console.log(sA);
            var orderArray = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];
            res.render('../public/schedule',{orderArray:orderArray,productArray:pA, valueArray:vA, sdow:dowToday,dow:dow});
            
        });

        app.get('/partNumberGen',function(req, res, next){
            
            var RLO = req.query.rlo || 171317;
            RLO = parseInt(RLO);
            var productOffering = {
                productLine:{
                    "Comfort":{
                        "leg":'1232LegPartNum123',"front":'1232FrontPartNum123',"stack-bar":'1232StackBarPartNum123','seat-support':'1232SeatSupportPartNum123',
                        backShape:{"HG":40,"SQ":40,"RN":40,"OV":40,"CR":50,"GEN-CR":56},
                        backOption:["Flex","Fixed"],
                        options:["Arm","GA","Ret-GA"]
                    },
                    "Encore":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "G2":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "G6":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "Eon":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "A3":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "Elite":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    }
                },
                
            }
            var part = {
                productLine:{"Comfort":{"leg":'109718',"front":'109716 or 109719',"stack-bar":'111231','seat-support':'111165'}},
                backShape:{"HG":'1098xx'},
                backOption:["Flex"],
                options:{"Arms":'xxxxxx',"Ret-GA":'xxxxxx'}
            };
            var partNumbers = {
                productLine:{
                    "Comfort":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "Encore":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "G2":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "G6":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "Eon":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "A3":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    },
                    "Elite":{
                        "leg":1,"front":1,"stack-bar":1,'seat-support':1
                    }
                },
                backShape:{"HG":40,"SQ":40,"RN":40,"OV":40,"CR":50,"GEN-CR":56},
                backOption:"Flex",
                options:["Arm","Ret-GA"]
            }
            res.render('../public/partNumberGen',{RLO:RLO,part:part});
        });
        callback(app);
        }
    }

module.exports = App;