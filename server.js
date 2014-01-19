var static = require('node-static'),
  http = require('http'),
  util = require('util'),
  url = require('url');

var webroot = './public',
  port = 8888;

var file = new static.Server('./public');

var Primus = require('primus');

var server = http.createServer(
    function(request, response){ /* Serve your static files */
        request.addListener('end', function () {
        file.serve(request, response);
        }).resume();
    }
);

primus = new Primus(server, {/* options */});

primus.on('connection', function (spark) {
    console.log("new Connexion");

    // data from client
    spark.on('data', function (data) {
        console.log('received data from the client', data);

        // broadcast new timer
        if (data['new_timer']){
            primus.write({'new_timer' : data['new_timer']});
        }
        // boardcast action
        if (data['action']){
            primus.write({'action' : data['action']});
        }
    });
});

server.listen(8888);
