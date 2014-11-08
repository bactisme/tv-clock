
var app = angular.module('tvclock', []);

app.controller('TvClockCtrl', function($scope, $timeout){
    $scope.timer = 0;
    $scope.time_state = 0;
    $scope.time_string = "00:00";
    $scope.time_class = "";

    $scope.chrono = 0;
    $scope.chrono_state = 0;
    $scope.chrono_string = "00:00";

    $scope.clock_string = "00:00:00";

    $scope.timer1 = null;
    $scope.primus = new Primus();

    $scope.inputtime = 0;

    $scope.is_master = 0;

    $scope.$watch('inputtime', function (){
        if ($scope.inputtime != 0)
            $scope.primus.write({'new_timer': $scope.inputtime*60 });
    });

    var flashTimer = function(){
        if ($scope.time_state == 1)
            $scope.time_class = "black";
    }

    // auto update timer
    $scope.$watch("timer", function(){
        if ($scope.timer > 0){
            var time_min = Math.ceil($scope.timer/60) - 1;
            var time_sec = $scope.timer - (60*time_min);
            if (time_min > 0){
                $scope.time_string = sprintf("%+02u:%+02u", time_min, time_sec);
                $scope.time_class = '';
            }else {
                $scope.time_string = sprintf("%+02u:%+02u", 0, $scope.timer);
                $scope.time_class = 'orange';
            }
        }else if ($scope.timer == 0){
            $scope.time_string = "00:00";
            $scope.time_class = '';
        }else{
            if ($scope.timer > -60){
                $scope.time_string = "-" + sprintf("%+02u:%+02u", 0, Math.abs($scope.timer));
                $scope.time_class = 'red';
                $timeout(flashTimer, 850);
            }else{
                var abstimer = Math.abs($scope.timer);
                time_min = Math.ceil(abstimer/60) - 1;
                time_sec = abstimer - (60*time_min);
                $scope.time_string = "-" + sprintf("%+02u:%+02u", time_min, time_sec);
                $scope.time_class = 'red';
            }
        }
    });

    // auto update chrono
    $scope.$watch("chrono", function (){
        $scope.chrono_string = sprintf("%+02u:%+02u", 0, $scope.chrono);
        if ($scope.chrono > 60){
            var chrono_min = Math.floor($scope.chrono/60);
            var chrono_sec = $scope.chrono - chrono_min*60;
            $scope.chrono_string = sprintf("%+02u:%+02u", chrono_min, chrono_sec);
        }
    });

    $scope.$watch('time_string', function(){
        document.title = $scope.time_string;
    });

    var decreaseTime = function (){
        if ($scope.time_state == 1)
            $scope.timer = $scope.timer - 1;
        if ($scope.chrono_state == 1)
            $scope.chrono = $scope.chrono + 1;

        // update clock
        var currentTime = new Date ();
        $scope.clock_string = sprintf("%+02u:%+02u:%+02u", currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds());

        $scope.timer1 = $timeout(decreaseTime, 1000);
    }
    $scope.timer1 = $timeout(decreaseTime, 1000);


    // action !
    $scope.pauseResumeTime = function (){
        //if one or another chrono is runing stop time
        if ($scope.time_state == 1 || $scope.chrono_state == 1){
            //stop time
            $scope.primus.write({'action':'pause'});
        }else{
            $scope.primus.write({'action':'resume'});
        }
    }

    $scope.startTimer = function (){
        if ($scope.chrono_state == 0){
            $scope.primus.write({'action': "startchrono"});
        }else{
            $scope.primus.write({'action': "reset"});
        }
    };

    $scope.setupTime = function(time){
        $scope.timer = time;
        $scope.time_state = 1;
    }

    // PRIMUS
    $scope.primus.on('data', function incoming(data) {
        if (data['new_timer']){
            $scope.setupTime(parseInt(data['new_timer']));
            console.log('new_timer = ' + data['new_timer']);
        }

        if (data['is_master']){
            console.log('is_master');
            $scope.is_master = 1;
        }

        if (data['ask_state']){
            if ($scope.is_master == 1){
                console.log('reply to ask_state');
                $scope.primus.write({'action': 'state',
                    'chrono_state': $scope.chrono_state,
                    'time_state': $scope.time_state,
                    'chrono': $scope. chrono,
                    'timer': $scope.timer,
                });
            }
        }

        if (data['action'] && data['action'] == "state"){
            if ($scope.is_master == 0){
                console.log('acknoledge state');
                console.log(data);
                $scope.chrono = data['chrono'];
                $scope.timer = data['timer'];
                $scope.time_state = data['time_state'];
                $scope.chrono_state = data['chrono_state'];
            }
        }
    
        // pause time
        if (data['action'] && data['action'] == "pause"){
            $scope.time_state = 0;
            $scope.chrono_state = 0;
        }
        // resume time
        if (data['action'] && data['action'] == "resume"){
            if ($scope.timer  != 0) $scope.time_state = 1;
            if ($scope.chrono != 0) $scope.chrono_state = 1;
        }
        // start chrono
        if (data['action'] && data['action'] == "startchrono"){
            $scope.chrono_state = 1;
            //$('#start-chrono').html('Reset');
        }
        // reset everything
        if (data['action'] && data['action'] == "reset"){
            document.title = "Timer";
            $scope.time_state = 0; $scope.chrono_state = 0;
            $scope.chrono = 0; $scope.timer = 0;
        }
        // stop timer
        if (data['action'] && data['action'] == "stoptimer"){
            $scope.time_state = 0;
            $scope.timer_string = "00:00";
            $scope.timer = 0;
        }
    });
});
