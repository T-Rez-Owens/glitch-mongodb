'use strict'
var express = require('express');
const App = require('./App');
var app = new App();



class Server {
    constructor() {
        return this;
    }

    startListening (route, callback) { 
        app.main((app2)=>{
            let server = app2.listen(3000, function() {
                let port = server.address().port;
                console.log('Express server listening on port %s.', port);
            });    
        });
        

        function callback() {
            return 5;
        }
        
    }
}

module.exports = Server;