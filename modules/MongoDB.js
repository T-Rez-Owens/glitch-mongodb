'use strict'
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert'),
    moment = require('moment'),
    path = require('path');

class MongoDB{
    constructor(uri) {
        this.uri = uri;
        this.db = {};
        
        
        return this;
    }

    connect() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(this.uri, function(err, db) {
                if(err!==null){
                    reject(err);
                }
                assert.equal(null, err);
                //console.log("Successfully connected to /%s.", db.s.databaseName);

                resolve(db);
            });
        });
        //module.exports = mongoReadyPromise;
    }
    mongoDatabaseGrabName (callback) {
        var dbPromise = this.connect();
        //console.log(dbPromise);
        return dbPromise.then(db => {
            //console.log(db.s.databaseName);
            console.log("Connected to: ", db.s.databaseName);
            callback(db.s.databaseName);
        },()=>{});
        
        //console.log(db.dbNameString);
        
    }
    mongoDataGrabOne (callback){
        var dbPromise = this.connect();
        return dbPromise.then(db =>{
            let cursor = db.collection('points').findOne(
                { }
              , { _id: false }
              , (err, cursor) => {
                    if (err) reject(err)
                    if (cursor) {
                        callback(cursor);
                    } else {
                        callback({});
                    }
                }
            )
        })
        
    }
    mongoDataGrabSensor(sensor, callback) {
        var dbPromise = this.connect();
        return dbPromise.then(db =>{
            let cursor = db.collection('points').findOne(
                {"sensor":sensor.sensor }
              , { _id: false }
              , (err, cursor) => {
                    if (err) reject(err)
                    if (cursor) {
                        callback(cursor);
                    } else {
                        callback({});
                    }
                }
            )
        })
    }
    mongoDataGrabSensorArray(sensor, callback) {
        var dbPromise = this.connect();
        return dbPromise.then(db =>{
            var options = {};
            options.sensor = sensor;
            options.limit = sensor.limit !== undefined ? sensor.limit : 10;
            options.skip = 0;
            var projection = { _id: false };
            var query = this.queryDocument(options);
            var cursor = db.collection('points').find(query);
            cursor.project(projection);
            db.collection('points').find(query).count(function(err,numOfSensors){
                console.log(`Returning ${options.limit} of ${numOfSensors}`);
                
            });
            
            
            cursor.limit(options.limit);
            cursor.skip(options.skip);
            cursor.sort([["_id",-1]]);//latest n docs without having to worry about time-stamp formatting.
            callback(cursor);    
        });
    }
    queryDocument(options) {
            //console.log(options);
            var query = {
                "sensor": options.sensor.sensor,
            };
            //console.log(query);
            return query;
    }
    insertSensor(sensor,callback){
      
        if(parseInt(sensor.value,10).isNan || sensor.sensor==null){
            console.log("bad sensor");
        } else {
            var dbPromise = this.connect();
            return dbPromise.then(db =>{
                db.collection('points').insertOne(
                    {"sensor":sensor.sensor, "value":parseInt(sensor.value,10), "time":sensor.time }
                  , (err,result) => {
                        if (err) reject(err)
                        if (result) {
                            console.log(`finished inserting ${result.insertedCount}  ${sensor.sensor} sensor with value:${parseInt(sensor.value,10)}`);
                            callback(result);
                        } else {
                            callback({});
                        }
                    }
                )
            })
        }
        
    }
    mongoClose(){
        var dbPromise = this.connect();
        return dbPromise.then(db=>{
            db.close();
        })
        
    }
}

module.exports = MongoDB;


