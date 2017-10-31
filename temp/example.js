/*
 * Copyright (c) 2016 ObjectLabs Corporation
 * Distributed under the MIT license - http://opensource.org/licenses/MIT
 *
 * Written with: mongodb@2.1.3
 * Documentation: http://mongodb.github.io/node-mongodb-native/
 * A Node script connecting to a MongoDB database given a MongoDB Connection URI.
*/

// server.js
// where your node app starts

// init project
var express = require('express');
var mongodb = require('mongodb');
var app = express();
var dbSongs="";
var pageHTML="";
app.use(express.static('public'));

// Create seed data
var seedData = [
  {
    decade: '1970s',
    artist: 'Debby Boone',
    song: 'You Light Up My Life',
    weeksAtOne: 10
  },
  {
    decade: '1980s',
    artist: 'Olivia Newton-John',
    song: 'Physical',
    weeksAtOne: 10
  },
  {
    decade: '1990s',
    artist: 'Mariah Carey',
    song: 'One Sweet Day',
    weeksAtOne: 16
  }
];

// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
var uri = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.PORT+'/'+process.env.DB;

mongodb.MongoClient.connect(uri, function(err, db) {
  if(err) throw err;
  pageHTML+='<link rel="shortcut icon" type="image/x-icon" href="https://cdn.glitch.com/32818d4a-a9ba-4992-904e-17657345efec%2Ffavicon.ico?1509041832553">';
  pageHTML+="<h1>MongoDB Backend DB hosted in mLAB</h1>";
  pageHTML+="Connecting to db "+process.env.DB+"<br />";
  
  /*
   * First we'll add a few songs. Nothing is required to create the 
   * songs collection; it is created automatically when we insert.
   */

  var points = db.collection('points');
  pageHTML+="Creating collection 'points'<br />";
  
   // Note that the insert method can take either an array or a dict.

  points.insert(seedData, function(err, result) {
    
    if(err) throw err;

    /*
     * Then we need to give Boyz II Men credit for their contribution
     * to the hit "One Sweet Day".
     */

    points.update(
      { song: 'One Sweet Day' }, 
      { $set: { artist: 'Mariah Carey ft. Boyz II Men' } },
      function (err, result) {
        
        if(err) throw err;

        /*
         * Finally we run a query which returns all the hits that spend 10 or
         * more weeks at number 1.
         */

        points.find({ weeksAtOne : { $gte: 10 } }).sort({ decade: 1 }).toArray(function (err, docs) {

          if(err) throw err;

          docs.forEach(function (doc) {
            console.log(
              'In the ' + doc['decade'] + ', ' + doc['song'] + ' by ' + doc['artist'] + 
              ' topped the charts for ' + doc['weeksAtOne'] + ' straight weeks.'
            );
            pageHTML+="Adding "+doc['artist']+" - "+doc['song']+" into 'songs'<br />";
          });
         
          // Since this is an example, we'll clean up after ourselves.
          points.drop(function (err) {
            pageHTML+="Dropping collection 'songs'<br />";
            if(err) throw err;
          
            // Only close the connection when your app is terminating.
            db.close(function (err) {
              pageHTML+="Closing db " + process.env.DB;
              if(err) throw err;
            });
          });
        });
      }
    );
  });
});

app.get("/", function (request, response) {
  response.send(pageHTML);
});

// listen for requests :)
var listener = app.listen("3000", function () {
  console.log('Your app is listening on port ' + listener.address().port);
});