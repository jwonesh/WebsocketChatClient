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

    //16KB chunks
    var BUFF_SIZE_RENDERER = 16384;

    var audioInput = null,
    microphone_stream = null,
    gain_node = null,
    script_processor_node = null;

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

    var process_microphone_buffer = function(event) {

        var microphone_output_buffer;

        microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now
        WebsocketService.sendVoiceChunk(microphone_output_buffer);
    };

    function start_speakers(stream){
    	var channels = 1;
		// Create an empty two second stereo buffer at the
		// sample rate of the AudioContext
		var frameCount = audioContext.sampleRate;
		var node = audioContext.createGain(BUFF_SIZE_RENDERER, 1, 1);
    	var myArrayBuffer = audioContext.createBuffer(1, 1 * BUFF_SIZE_RENDERER, audioContext.sampleRate);


    	var source = audioContext.createBufferSource();
    	source.buffer = myArrayBuffer;
    	source.connect(audioContext.destination);
    	source.loop = true;
		source.start(0);

		//for (var channel = 0; channel < channels; channel++) {
		   // This gives us the actual ArrayBuffer that contains the data
		   //var nowBuffering = myArrayBuffer.getChannelData(channel);
		   //for (var i = 0; i < frameCount; i++) {
		     // Math.random() is in [0; 1.0]
		     // audio needs to be in [-1.0; 1.0]
		   //  nowBuffering[i] = Math.random() * 2 - 1;
		  // }
		 // }

		voiceWrapper.audioBuffer = myArrayBuffer;
		voiceWrapper.source = source;
		voiceWrapper.buff_size = BUFF_SIZE_RENDERER;
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