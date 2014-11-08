var static = require('node-static'),
  http = require('http'),
  util = require('util'),
  url = require('url');

var webroot = './public',
  port = 8001;

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

var connexions = [];

primus.on('connection', function (spark) {
    console.log("-> New Client");

    if (connexions.length == 0){
        primus.write({'is_master': true})
    }else{
        primus.write({'ask_state': true });
    }

    connexions.push(spark.id);

    // data from client
    spark.on('data', function (data) {
        console.log('received data from the client', data);

        // broadcast new timer
        if (data['new_timer']){
            primus.write({'new_timer' : data['new_timer']});
        }
        // boardcast all action
        if (data['action']){
            primus.write(data);
        }
    });
});

primus.on('disconnection', function (spark) {
    var index = connexions.indexOf(spark.id);
    if (index > -1) {
        connexions.splice(index, 1);
    }
    
});

server.listen(port);
