'use strict';

angular.module('myApp')

.factory('VoiceService', ['$q', function($q) {
	var service = {};

	service.getVoiceWrapper = getVoiceWrapper;
	service.clearUserWrapper = clearVoiceWrapper;

	var voiceWrapper = {};
	voiceWrapper.chatRooms = [];
	voiceWrapper.audioBuffer = null;
	voiceWrapper.BUFF_SIZE_RENDERER = 2048;
	voiceWrapper.bufferHeuristic = 8;


	function getVoiceWrapper(){
		return voiceWrapper;
	}

	function clearVoiceWrapper(){
		for (var k in voiceWrapper){
			voiceWrapper[k] = null;
		}
	}

	return service;
}])
.controller('VoiceServiceCtl', function ($scope, VoiceService){

});