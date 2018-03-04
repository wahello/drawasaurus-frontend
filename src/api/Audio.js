//Web Audio API, thanks to Matt Harrison!
//http://matt-harrison.com/perfect-web-audio-on-ios-devices-with-the-web-audio-api/

import sndJoinOgg from 'sounds/join.ogg';
import sndJoinAac from 'sounds/join.aac';
import sndLeaveOgg from 'sounds/leave.ogg';
import sndLeaveAac from 'sounds/leave.aac';
import sndTimerOgg from 'sounds/click.ogg';
import sndTimerAac from 'sounds/click.aac';
import sndGuessOgg from 'sounds/correct.ogg';
import sndGuessAac from 'sounds/correct.aac';
import sndCorrectOgg from 'sounds/youcorrect.ogg';
import sndCorrectAac from 'sounds/youcorrect.aac';
import sndTurnOgg from 'sounds/turn.ogg';
import sndTurnAac from 'sounds/turn.aac';
import sndGuessingOverOgg from 'sounds/guessingover.ogg';
import sndGuessingOverAac from 'sounds/guessingover.aac';

try {
	window.AudioContext = window.AudioContext || window.webkitAudioContext;
	window.audioContext = new window.AudioContext();
} catch( e ) {
	console.log( 'No web audio API support' );
}

let WebAudioAPISoundManager = function( context )
{
	this.context = context;
	this.bufferList = {};
	this.playingSounds = {};
};
WebAudioAPISoundManager.prototype = {
	addSound: function( url )
	{
		var request = new XMLHttpRequest();
		request.open( 'GET', url, true );
		request.responseType = 'arraybuffer';
		var self = this;
		request.onload = function()
		{
			self.context.decodeAudioData(
				request.response,
				function( buffer ) {
					if( !buffer )
					{
						console.log( 'Error decoding file data: ' + url );
						return;
					}
					self.bufferList[ url ] = buffer;
				});
		};
		request.onerror = function() {
			console.log( 'Buffer loader error' );
		};
		request.send();
	},
	stopSoundWithURL: function( url )
	{
		if( this.playingSounds.hasOwnProperty( url ) ) {
			for( var i in this.playingSounds[ url ] )
			{
				if( this.playingSounds[ url ].hasOwnProperty( i ) )
				{
					this.playingSounds[ url ][ i ].noteOff( 0 );
				}
			}
		}
	}
};

let WebAudioAPISound = function( urls, options )
{
	this.settings = {
		loop: false,
		volume: 1
	};
	for( var i in options )
	{
		if( options.hasOwnProperty( i ) )
		{
			this.settings[ i ] = options[ i ];
		}
	}
	var audio = document.createElement( 'audio' );
	if( audio.canPlayType( 'audio/ogg;' ) )
	{
		this.url = urls.ogg;
	} else {
		this.url = urls.aac;
	}
	window.webAudioAPISoundManager = window.webAudioAPISoundManager || new WebAudioAPISoundManager( window.audioContext );
	this.manager = window.webAudioAPISoundManager;
	this.manager.addSound( this.url );
};
WebAudioAPISound.prototype = {
	play: function( vol, force ) {
		var buffer = this.manager.bufferList[ this.url ];
		if( typeof buffer !== "undefined" )
		{
			if( typeof vol === 'undefined' ) {
				vol = this.settings.volume;
			}

			let savedVolume = localStorage.getItem( 'volume' );
			if( force !== true && savedVolume !== null ) {
				vol *= ( savedVolume / 100 );
			}

			var source = this.makeSource( buffer, vol );
			source.loop = this.settings.loop;
			source.start( 0 );

			if( !this.manager.playingSounds.hasOwnProperty( this.url ) )
			{
				this.manager.playingSounds[ this.url ] = [];
			}
			this.manager.playingSounds[ this.url ].push( source );
		}
	},
	stop: function() {
		this.manager.stopSoundWithURL( this.url );
	},
	getVolume: function() {
		return this.settings.volume;
	},
	setVolume: function( volume )
	{
		this.settings.volume = volume;
	},
	translateVolume: function( volume, inverse ) {
		return inverse ? volume * 100 : volume / 100;
	},
	makeSource: function( buffer, vol ) {
		var source = this.manager.context.createBufferSource();
		var gainNode = this.manager.context.createGain();
		source.buffer = buffer;
		source.connect( gainNode );
		gainNode.connect( this.manager.context.destination );
		gainNode.gain.value = this.settings.volume;

		if( vol !== undefined )
			gainNode.gain.value = vol;

		return source;
	}
};

export const sndJoin = new WebAudioAPISound( { 'ogg': sndJoinOgg, 'aac': sndJoinAac }, { volume: .3 } );
export const sndLeave = new WebAudioAPISound( { 'ogg': sndLeaveOgg, 'aac': sndLeaveAac }, { volume: .3 } );
export const sndTimer = new WebAudioAPISound( { 'ogg': sndTimerOgg, 'aac': sndTimerAac }, { volume: .55 } );
export const sndGuess = new WebAudioAPISound( { 'ogg': sndGuessOgg, 'aac': sndGuessAac }, { volume: .15 } );
export const sndCorrect = new WebAudioAPISound( { 'ogg': sndCorrectOgg, 'aac': sndCorrectAac }, { volume: .25 } );
export const sndTurn = new WebAudioAPISound( { 'ogg': sndTurnOgg, 'aac': sndTurnAac });
export const sndGuessingOver = new WebAudioAPISound( { 'ogg': sndGuessingOverOgg, 'aac': sndGuessingOverAac }, { volume: .4 } );

let soundsInit = false;
export const initSounds = () => {
	if( !soundsInit ) {
		if( typeof sndTimer !== 'undefined' ) {
			sndTimer.play( 0 );
		}
		soundsInit = true;
	}
}