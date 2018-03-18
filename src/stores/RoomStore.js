import { observable, action, computed } from 'mobx';
import { getRoomName } from 'Lobby';

class RoomStore {
    @observable canvasWindow = 0;
    @observable currentDrawer = false;
    @observable errorButtons = [ false, false, false ];
    @observable errorMessage = '';
    @observable headerStatus = 'Loading room...';
    @observable keyboardOpen = false;
    @observable kicked = false;
    @observable guessedWord = true;
    @observable messages = [];
    @observable roomName = null;
    @observable roomMaxPlayers = 8;
    @observable roomStatus = 'Connecting to room...';
    @observable timeAFK = 0;
    @observable users = new Map();
    @observable wordChoices = [];
    @observable lowestHeight = null;
    @observable boardMaxHeight = "none";
    @observable forceRefresh = false;
    @observable forceShowUsers = false;

    chatMessageId = 0;

    constructor( rootStore ) {
        this.rootStore = rootStore;
    }

    @computed get displayRoomName() {
        return getRoomName( this.roomName );
    }

    @computed get userCount() {
        return this.users.size;
    }
    
    @computed get usersHidden() {
        return this.userCount < 1 || this.keyboardOpen;
    }

    @action.bound addChatMessage( message ) {
        message[3] = this.chatMessageId++;
        this.messages.push( message );

        if( this.messages.length > 50 ) {
            this.messages.shift();
        }
    }

    @action.bound resetUserBorders( drawer ) {
        this.users.forEach( ( user, key ) => {
            if( key === drawer ) {
                user.isDrawing = 1;
            } else {
                user.isDrawing = 0;
            }
        } );
    }

    @action.bound resetUserScores() {
        this.users.forEach( ( user, key ) => {
            user.currentScore = 0;
        } );
    }
}

export default RoomStore;