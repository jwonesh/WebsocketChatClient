'use strict';

angular.module('myApp.main', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/main', {
    templateUrl: 'main/main.html',
    controller: 'MainCtrl'
  });
}])

.controller('MainCtrl', ['$scope', 'UserService', 'WebsocketService', 'VoiceService', function($scope, UserService, WebsocketService, VoiceService) {
	var vm = this;

	var voiceWrapper = VoiceService.getVoiceWrapper();

	vm.data = {};
	vm.data.userWrapper = UserService.getUserWrapper();

	vm.tabs = {};
	vm.tabs.selected = 0;

	$scope.vm = vm;

	//var audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // define audio context
	// Webkit/blink browsers need prefix, Safari won't work without window.

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var webaudio_tooling_obj = function () {

    var audioContext = new AudioContext();

    console.log("audio is starting up ...");

    //4KB chunks
    //refactor into global variable
    var BUFF_SIZE_RENDERER = voiceWrapper.BUFF_SIZE_RENDERER;

    var audioInput = null,
    microphone_stream = null,
    gain_node = null,
    script_processor_node = null;
    var bufferHeuristic = voiceWrapper.bufferHeuristic;

    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (navigator.getUserMedia){

        navigator.getUserMedia({audio:true}, 
            function(stream) {
                start_microphone(stream);
                start_speakers(stream);
                console.log("Audio started.")
            },
            function(e) {
                alert('Error capturing audio.');
            }
            );

    } else { alert('getUserMedia not supported in this browser.'); }

    var process_audio_buffer = function(event){

    };

    var microphone_output_buffer;
    var c = new OfflineAudioContext(1, BUFF_SIZE_RENDERER, 48000);
    var b = null;
    var s = c.createBufferSource();
    b = c.createBuffer(1, BUFF_SIZE_RENDERER, audioContext.sampleRate);
    s.buffer = b;
    s.start();

    var process_microphone_buffer = function(event) {

        
        microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now
        WebsocketService.sendVoiceChunk(microphone_output_buffer);

            

            //b.copyToChannel(microphone_output_buffer, 0);



            //c.startRendering().then(function (result) {
            //    WebsocketService.sendVoiceChunk(result.getChannelData(0));
            //});
    };

    function start_speakers(stream){
        voiceWrapper.frameCount = audioContext.sampleRate;
        voiceWrapper.audioContext = audioContext;
		///////////
    }

    function start_microphone(stream){

        microphone_stream = audioContext.createMediaStreamSource(stream);

        var node = audioContext.createGain(BUFF_SIZE_RENDERER, 1, 1);
		microphone_stream.connect(node);

        script_processor_node = audioContext.createScriptProcessor(BUFF_SIZE_RENDERER, 1, 1);
        script_processor_node.onaudioprocess = process_microphone_buffer;

        node.connect(script_processor_node);

        script_processor_node.connect(audioContext.destination);

    }

}();

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]);