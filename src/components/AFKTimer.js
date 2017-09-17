import { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action } from 'mobx';
import { sndTimer } from 'api/Audio';

@inject('rootStore','socket') @observer
class AFKTimer extends Component {
    constructor( props ) {
        super( props );
        this.windowHidden = false;
        this.timer = null;

        //Lobby
        this.lobbyDisconnect = false;

        //Room
        this.reminderTime = 0;
        this.warningTime = 10;
        this.timeOut = 70;
        this.mouseMoved = false;
    }

    componentWillMount() {
        document.addEventListener( 'visibilitychange', this.visibilityChange, false );
        if( this.props.room ) {
            this.timer = setInterval( this.roomTimer, 1000 );
            document.addEventListener( 'mousemove', this.madeMovement, false );
            document.addEventListener( 'keydown', this.madeMovement, false );
            document.addEventListener( 'touchstart', this.madeMovement, false );
        } else if ( this.props.lobby ) {
            this.timer = setInterval( this.lobbyTimer, 1000 );
        }
    }
    
    componentWillUnmount() {
        document.removeEventListener( 'visibilitychange', this.visibilityChange, false );
        clearInterval( this.timer );

        if( this.props.room ) {
            document.removeEventListener( 'mousemove', this.madeMovement, false );
            document.removeEventListener( 'keydown', this.madeMovement, false );
            document.removeEventListener( 'touchstart', this.madeMovement, false );
        }
    }

    visibilityChange = () => {
        if( document.visibilityState === 'hidden' ) {
			this.windowHidden = true;
		} else {
			this.windowHidden = false;
		}
    }

    limitMovementPoll = false;
    madeMovement = () => {
        const { roomStore } = this.props.rootStore;
        if( this.limitMovementPoll ) return;
        if( roomStore.timeAFK >= this.timeOut ) return;

        this.mouseMoved = true;
        this.limitMovementPoll = true;

        setTimeout( () => { this.limitMovementPoll = false; }, 1000 );
    }

    @action roomTimer = () => {
        const { uiStore, roomStore } = this.props.rootStore;
        const { socket } = this.props;
        if( uiStore.connecting ) return;
        if( !uiStore.connectedToRoom ) return;
        if( roomStore.currentDrawer ) { 
            roomStore.timeAFK = 0;
            return;
        }
        
        if( this.windowHidden && !roomStore.guessedWord ) {
            this.reminderTime++;
            //Play sound (every 3s) if window is hidden and user hasn't guessed word
            if( this.reminderTime >= 3 ) {
                this.reminderTime = 0;
                sndTimer.play( .9 );
            }
        } else {
            this.reminderTime = 0;
        }

        if( ( !document.hasFocus() && !this.mouseMoved ) || !this.mouseMoved ) {
            roomStore.timeAFK++;

            if ( roomStore.timeAFK === this.timeOut ) {
                roomStore.errorMessage = `Still playing? (${this.warningTime})`;
                roomStore.errorButtons = [ false, true, false ];
                sndTimer.play();
            } else if ( roomStore.timeAFK > this.timeOut ) {
                sndTimer.play();
                roomStore.errorButtons = [ false, true, false ];
                let left = Math.max(0, this.warningTime - ( roomStore.timeAFK - this.timeOut ) );
                roomStore.errorMessage = `Still playing? (${left})`;
                if( left <= 0 ) {
                    socket.emit( 'afkPlayer' );
                    roomStore.errorMessage = '';
                }
            }
        } else {
            roomStore.timeAFK = 0;
            this.mouseMoved = false;
        }
    }

    @action lobbyTimer = () => {
        const { roomStore } = this.props.rootStore;
        const { socket } = this.props;

        //Disconnect from lobby when AFK for 30 seconds
        if( this.windowHidden && !this.lobbyDisconnect ) {
            roomStore.timeAFK++;
            if ( roomStore.timeAFK > 30 ) {
                socket.emit( 'lobbyAFK' );
                this.lobbyDisconnect = true;
            }
        } else if( !this.windowHidden ) {
            roomStore.timeAFK = 0;
            //Reconnect when window is visible
            if( this.lobbyDisconnect ) {
                this.lobbyDisconnect = false;
                socket.connect();
            }
        }
    }

    render() {
        return null;
    }
}

export default AFKTimer;