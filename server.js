var static = require('node-static'),
  http = require('http'),
  util = require('util'),
  url = require('url');

var webroot = './public';
//var port = process.env.PORT || 8001;
var port = 8001;

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


// keeping time
var time_state = 0;
var chrono_state = 0;
var timer = null;
var chrono = 0;

pushState = function (){
    primus.write({'action': 'state',
        'chrono_state': chrono_state,
        'time_state': time_state,
        'chrono': chrono,
        'timer': timer,
    });
}

decreaseTime = function (){
    if (time_state == 1)
        timer = timer - 1;
    if (chrono_state == 1)
        chrono = chrono + 1;
    setTimeout(decreaseTime, 1000);
}
setTimeout(decreaseTime, 1000);

consoleTime = function(){
    console.log(" Timer : " + timer + " - Timer state : " + time_state); 
    setTimeout(consoleTime, 10000);
    pushState();
}
setTimeout(consoleTime, 10000);


// --- connection management

primus.on('connection', function (spark) {
    console.log("-> New Client");
    connexions.push(spark.id);
    // push state
    pushState();

    // data from client
    spark.on('data', function (data) {
        console.log('received data from the client', data);

        // broadcast new timer
        if (data['new_timer']){
            primus.write({'new_timer' : data['new_timer']});
            timer = parseInt(data['new_timer']);
            time_state = 1;
        }

        // boardcast all action
        if (data['action']){
            primus.write(data);
        }

        // --- REACT TO ACTION ---
        if (data['ask_state']){
            console.log('reply to ask_state');
            pushState();
        }

        if (data['action'] && data['action'] == "pause"){
            time_state = 0;
            chrono_state = 0;
        }
        // resume time
        if (data['action'] && data['action'] == "resume"){
            if (timer  != 0) time_state = 1;
            if (chrono != 0) chrono_state = 1;

        }
        // start chrono
        if (data['action'] && data['action'] == "startchrono"){
            chrono_state = 1;
        }
        // reset everything
        if (data['action'] && data['action'] == "reset"){
            time_state = 0; chrono_state = 0;
            chrono = 0; timer = 0;
        }
        // stop timer
        if (data['action'] && data['action'] == "stoptimer"){
            time_state = 0;
            timer = 0;
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
