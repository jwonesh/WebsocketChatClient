'use strict';

angular.module('myApp')

.factory('VoiceService', ['$q', function($q) {
	var service = {};

	service.getVoiceWrapper = getVoiceWrapper;
	service.clearUserWrapper = clearVoiceWrapper;

	var voiceWrapper = {};
	voiceWrapper.chatRooms = [];
	voiceWrapper.audioBuffer = null;

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