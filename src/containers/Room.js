import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action, reaction } from 'mobx';
import classNames from 'classnames';
import Canvas from 'Canvas';
import CanvasCursor from 'CanvasCursor';
import CanvasControls, { WINDOW_WORDPICKER } from 'CanvasControls';
import Chat from 'Chat';
import UserList from 'UserList';
import AFKTimer from 'AFKTimer';
import RoomError from 'RoomError';
import { BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT } from 'CanvasStore';
import { sndJoin, sndLeave, sndTimer, sndGuess, sndCorrect, sndTurn, sndGuessingOver } from 'api/Audio';
import 'styles/Room.scss';
import { IS_SSR, USING_MOBILE, USING_IOS } from 'api/UserAgent';

const MIN_CHAT_HEIGHT = 150;
const MIN_CHAT_WIDTH = 150;
const MIN_CHAT_WIDTH_TINY = 120;
const MIN_CHAT_WIDTH_WITH_KEYBOARD = 100;

@inject('rootStore','socket') @observer
class Room extends Component {
    @observable firstResize = true;

    constructor( props ) {
        super( props );
        this.soundsInit = false;
        this.firstUserUpdate = true;
    }
    
    @action componentWillMount() {
        const { roomStore, uiStore } = this.props.rootStore;
        const { socket } = this.props;

        if( this.props.match.params.name ) {
            roomStore.roomName = this.props.match.params.name.replace(/\+/g, ' ');
        } else {
            roomStore.roomName = 'Drawasaurus';
        }
        uiStore.connectingToRoom = true;

        socket.on( 'connect', this.onConnect );
        socket.on( 'disconnect', this.onDisconnect );
        socket.on( 'existingUsername', this.joinRoom );
        socket.on( 'joinedRoom', this.joinedRoom );

        socket.on( 'practiceMode', this.startPracticeMode );
        socket.on( 'startingGame', this.startGame );
        socket.on( 'showWordPicker', this.showWordPicker );
        //Other players waiting
        socket.on( 'prepareDrawing', this.prepareDrawing );
        //Drawer picked word
        socket.on( 'youDrawing', this.youDrawing );
        //Other players find out
        socket.on( 'startDrawing', this.startDrawing );
        socket.on( 'guessingOver', this.guessingOver );
        socket.on( 'updateRound', this.updateRound );
        socket.on( 'endRound', this.endRound );
        socket.on( 'revealWord', this.revealWord );

        socket.on( 'userJoined', this.userJoined );
        socket.on( 'userLeft', this.userLeft );
        socket.on( 'userChangedNick', this.userChangedNick );
        socket.on( 'userCorrect', this.userCorrect );
        socket.on( 'youCorrect', this.youCorrect );
        socket.on( 'updateUsers', this.updateUsers );

        socket.on( 'chatUser', this.addUserMessage );
        socket.on( 'chatNotification', this.addNotification );

        socket.on( 'timerUpdate', this.timerUpdate );
        socket.on( 'skipPlayer', this.skipPlayer );
        
        reaction( () => roomStore.forceRefresh,
            forceRefresh => {
                if( forceRefresh ) {
                    this.updateDimensions();
                    roomStore.forceRefresh = false;
                }
            }
        );
    }
    
    componentDidMount() {
        window.addEventListener( 'load', this.updateDimensions );
        window.addEventListener( 'resize', this.updateDimensions );
    }

    componentWillUnmount() {
        window.removeEventListener( 'load', this.updateDimensions );
        window.removeEventListener( 'resize', this.updateDimensions );
    }

    @action onConnect = () => {
        const { uiStore } = this.props.rootStore;
        uiStore.connectingToRoom = false;
        this.addNotification( `Thanks for playing, please be polite to other players and avoid drawing words or letters!
            Share ___ROOM_LINK___ to invite people to your room.`, 'info-circled' );
    }

    @action onDisconnect = () => {
        const { roomStore, uiStore } = this.props.rootStore;
        window.onbeforeunload = null;
        sndLeave.play();
        uiStore.connectedToRoom = false;
        if( roomStore.kicked ) return;
        roomStore.errorMessage = 'Sorry, you were disconnected!';
        roomStore.errorButtons = [ true, false, true ];
    }

    addUserMessage = ( msg, name ) => {
        const { roomStore } = this.props.rootStore;
        let message = [ 0, name, msg ];
        roomStore.addChatMessage( message );
    }

    addNotification = ( msg, icon ) => {
        const { roomStore } = this.props.rootStore;
        let message = [ 1, msg, icon ];
        roomStore.addChatMessage( message );
    }

    @action startPracticeMode = () => {
        const { roomStore, canvasStore } = this.props.rootStore;
        window.onbeforeunload = null;
        roomStore.canvasWindow = 0;
        roomStore.currentDrawer = true;
        roomStore.fillColour = '#fff';
        roomStore.headerStatus = 'Practice Mode';
        roomStore.roomStatus = 'Waiting for players...';
        canvasStore.timerVisible = false;
        roomStore.resetUserScores();
    }

    @action startGame = () => {
        const { roomStore } = this.props.rootStore;
        roomStore.headerStatus = 'Starting Game';
        roomStore.canvasWindow = 0;
        roomStore.roomStatus = 'Starting new game...';
        roomStore.fillColour = '#fff';
        roomStore.currentDrawer = false;
        roomStore.resetUserScores();
        window.onbeforeunload = () => { return 'Are you sure you want to leave?' };
    }

    @action youDrawing = ( word ) => {
        const { roomStore } = this.props.rootStore;
        roomStore.fillColour = '#fff';
        roomStore.canvasWindow = 0;
        roomStore.timerVisible = true;
        roomStore.timerSeconds = 90;
        roomStore.canvasWindow = 0;
        roomStore.currentDrawer = true;
        // roomStore.roomStatus = `You are drawing ${word.toUpperCase()}`;
        roomStore.roomStatus = [ 'You are drawing ', <span className="u-bold">{word.toUpperCase()}</span> ];
        roomStore.guessedWord = false;
    } 

    @action prepareDrawing = ( nick, id ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        this.addNotification( `${nick} is now drawing.`, 'pencil' );
        roomStore.resetUserBorders( id );
        roomStore.canvasWindow = 0;
        roomStore.currentDrawer = false;
        roomStore.roomStatus = [ <span className="u-bold">{nick}</span>, ' is choosing a word...' ];
        canvasStore.timerVisible = true;
        canvasStore.timerCentered = true;
        canvasStore.timerSeconds = 10;

        sndTurn.play( 0.75 );
    }

    @action skipPlayer = () => {
        const { roomStore } = this.props.rootStore;
        roomStore.canvasWindow = 0;
        roomStore.timerVisible = false;
    }

    @action joinRoom = () => {
        const { roomStore } = this.props.rootStore;
        const { socket } = this.props;

        socket.emit( 'joinRoom', roomStore.roomName );
    }

    @action joinedRoom = ( roomName, maxPlayers ) => {
        const { uiStore, roomStore } = this.props.rootStore;
        roomStore.roomName = roomName;
        if( maxPlayers !== undefined && maxPlayers !== null) {
            roomStore.roomMaxPlayers = maxPlayers;
        }
        uiStore.connectedToRoom = true;
    }

    @action userJoined = ( nick, old, id, user ) => {
        const { roomStore } = this.props.rootStore;
        sndJoin.play();        

        let msg = '';
        if( old === '' ) {
            msg = `${nick} joined the room.`;
        } else {
            if( nick === old ) {
                msg = `${nick} rejoined the room.`
            } else {
                msg = `${old} rejoined the room as ${nick}.`
            }
        }
        this.addNotification( msg, 'login' );

        user.id = id;
        roomStore.users.set( id, user );
    }

    @action userLeft = ( nick, drawing, id ) => {
        const { roomStore } = this.props.rootStore;
        sndLeave.play();
        
        let msg = '';
        let icon = 'logout';
        if( drawing === '' )
        {
            msg = `${nick} left the game.`;
        } else if ( drawing === true ) {
            icon = 'attention';
            msg = `${nick} left the game while choosing a word.`;
        } else {
            icon = 'attention';
            msg = `${nick} left the game while drawing ${drawing}.`;
            this.revealWord( nick, drawing );
        }

        this.addNotification( msg, icon );
        roomStore.users.delete( id );
    }

    @action userCorrect = ( id, nick, score, total ) => {
        let { roomStore } = this.props.rootStore;
        sndGuess.play();
        let user = roomStore.users.get( id );
        user.currentScore = total;
        user.isDrawing = 2;
        roomStore.users.set( id, user );

        let msg = `${nick} guessed the word! (+${score})`;
        this.addNotification( msg, 'ok' );
    }

    @action youCorrect = ( id, score, total, word, nick ) => {
        let { roomStore } = this.props.rootStore;
        sndCorrect.play();
        let user = roomStore.users.get( id );
        user.currentScore = total;
        user.isDrawing = 2;
        roomStore.users.set( id, user );

        let msg = `You guessed the word! (+${score})`;
        this.addNotification( msg, 'ok' );
        this.revealWord( nick, word );
    }

    @action guessingOver = ( msg, id, total, nick, word ) => {
        sndGuessingOver.play();

        if( msg !== null ) {
            let { roomStore } = this.props.rootStore;
            let user = roomStore.users.get( id );
            user.currentScore = total;
            this.addNotification( msg, 'info-circled' );
            this.revealWord( nick, word, true );
        }
    }

    @action userChangedNick = ( id, nick ) => {
        const { roomStore } = this.props.rootStore;
        let user = roomStore.users.get( id );
        user.nick = nick;
        roomStore.users.set( id, user );
    }

    @action updateUsers = ( users, roomName ) => {
        const { uiStore, roomStore } = this.props.rootStore;

        uiStore.roomName = roomName;
        users = JSON.parse( users );
        for( let id in users ) {
            let user = users[ id ];
            user.id = id;
            user.me = ( user.nick === uiStore.currentUsername );
            roomStore.users.set( id, user );
        }

        if( this.firstUserUpdate ) {
            setTimeout( () => sndJoin.play(), 100 );
            this.firstUserUpdate = false;

            if( roomStore.users.size > 1 ) {
                window.onbeforeunload = () => { return 'Are you sure you want to leave?' };
            }
        }
    }

    @action revealWord = ( nick, word, over ) => {
        if( word === null ) return;
        const { roomStore } = this.props.rootStore;
        if( over ) {
            roomStore.roomStatus = [ <span className="u-bold">{nick}</span>, ' was drawing ', <span className="u-bold">{word.toUpperCase()}</span> ];
        } else {
            roomStore.roomStatus = [<span className="u-bold">{nick}</span>, ' is drawing ', <span className="u-bold">{word.toUpperCase()}</span>];
        }
        roomStore.guessedWord = true;
    }

    @action timerUpdate = ( time ) => {
        const { canvasStore } = this.props.rootStore;
        time = parseInt( time, 10 );
        if( time <= 5 && time !== 0 ) {
            sndTimer.play();
        }
        canvasStore.timerSeconds = time;
    }

    @action showWordPicker = ( words, id ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        //reset user borders
        roomStore.resetUserBorders( id );
        words = JSON.parse( words );
        this.addNotification( 'You are now drawing.', 'pencil' );
        roomStore.roomStatus = 'You are choosing a word...';
        roomStore.brushColour = '#000';
        roomStore.canvasWindow = WINDOW_WORDPICKER;
        roomStore.wordChoices = words;

        canvasStore.timerCentered = false;
        canvasStore.timerSeconds = 10;
        canvasStore.timerVisible = true;

        setTimeout( () => {
            if( roomStore.canvasWindow === WINDOW_WORDPICKER ) {
                sndTurn.play( .5 );
            }
        }, 4500 );

        sndTurn.play( .9 );
    }

    @action startDrawing = ( nick, blanks ) => {
        const { roomStore, uiStore, canvasStore } = this.props.rootStore;
        roomStore.timerVisible = true;
        roomStore.timerCentered = false;

        if( nick === uiStore.currentUsername ) {
            roomStore.currentDrawer = true;
            canvasStore.timerSeconds = 90;
        } else {
            roomStore.roomStatus = [ <span className='u-bold'>{nick}</span>, ' is drawing ', <span className='u-blanks u-bold'>{blanks}</span> ];
            canvasStore.timerCentered = false;
            canvasStore.timerSeconds = 90;
            roomStore.guessedWord = false;
        }
    }

    @action endRound = ( msg ) => {
        const { roomStore } = this.props.rootStore;
        roomStore.currentDrawer = false;
        roomStore.timerVisible = false;
        roomStore.roomStatus = msg;
    }

    @action updateRound = ( name, current, max ) => {
        const { roomStore } = this.props.rootStore;
        if( current === 0 ) {
            roomStore.headerStatus = 'Starting Game';
        } else {
            roomStore.headerStatus = `Round ${current}/${max}`;
        }
    }

    @action updateDimensions = () => {
        const { canvasStore, roomStore } = this.props.rootStore;

        let landscape = true;
        let w = window.innerWidth;
        let h = this.main.clientHeight;
        let header = this.header.clientHeight;
        h -= header;

        if( USING_MOBILE && !USING_IOS ) {
            if (roomStore.lowestHeight === null || roomStore.lowestHeight > h ) {
                roomStore.lowestHeight = h;
            } else if( roomStore.lowestHeight !== null && roomStore.keyboardOpen ) {
                roomStore.lowestHeight = true;
            }
        }

        //Can't get real size of window when iOS keyboard is open, force landscape instead
        let forceLandscape = roomStore.keyboardOpen && USING_IOS;

        if( w > h || forceLandscape ) {
            h -= 11;
            let pct = BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT;
            let newW = Math.round( h * pct );

            let minChatWidth = MIN_CHAT_WIDTH;
            if( roomStore.keyboardOpen ) {
                minChatWidth = MIN_CHAT_WIDTH_WITH_KEYBOARD;
            } else if( w <= 470 ) {
                minChatWidth = MIN_CHAT_WIDTH_TINY;
            }

            if( newW + minChatWidth >= w ) {
                pct = BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH;
                newW = w - minChatWidth;
                h = Math.round( newW * pct );
            } 

            w = newW;
        } else {
            w -= 10;
            landscape = false;
            let pct = BASE_CANVAS_HEIGHT / BASE_CANVAS_WIDTH;
            let newH = Math.round( w * pct );

            if( newH + MIN_CHAT_HEIGHT >= h ) {
                pct = BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT;
                newH = h - MIN_CHAT_HEIGHT;
                w = Math.round( newH * pct );
            }

            h = newH;
        }

        if( forceLandscape ) {
            roomStore.boardMaxHeight = h + header;
            window.scrollTo(0, 1);
        } else {
            roomStore.boardMaxHeight = "none";
        }
        
        canvasStore.landscape = landscape;
        canvasStore.canvasHeight = h;
        canvasStore.canvasWidth = w;
        canvasStore.headerHeight = header;
        canvasStore.updateCanvasBound = true;
        this.firstResize = false;
    }

    render() {
        const { roomStore, canvasStore } = this.props.rootStore;        
        const mainClasses = classNames( {
            'l-room u-flex': true,
            'is-portrait': !canvasStore.landscape
        } );
        const boardClasses = classNames( {
            'l-board u-flex': true,
            'u-hidden': this.firstResize || IS_SSR
        } );
        const sidebarClasses = classNames( {
            'l-sidebar u-flex-columns': true,
            'l-sidebar--no-users': roomStore.keyboardOpen
        } );
        const sidebarStyles = canvasStore.landscape ? {  maxWidth: Math.min( 170, window.innerWidth - canvasStore.canvasWidth - 12 ) } : {};
        const spinnerClasses = classNames( {
            'c-spinner c-spinner--room': true,
            'u-hidden': !this.firstResize && !IS_SSR
        } );
        return (
            <div className={mainClasses} ref={main => this.main = main}>
                <RoomError />
                <div className={spinnerClasses} />
                <div className={boardClasses} style={{maxHeight: roomStore.boardMaxHeight}}>
                    <div className="l-canvas u-flex-columns">
                        <div ref={header => this.header = header} className="c-canvas-header u-no-select">
                            {roomStore.roomStatus}
                        </div>
                        <CanvasControls />
                        <div className="l-canvas-cursor"
                            style={{ cursor: (canvasStore.cursorVisible) ? 'none' : 'auto' }}>
                            <CanvasCursor />
                            <Canvas />
                        </div>
                    </div>
                    <div className={sidebarClasses} style={sidebarStyles}>
                        <UserList />
                        <Chat />
                    </div>
                </div>
                <AFKTimer room />
            </div>
        );
    }
}

export default Room;