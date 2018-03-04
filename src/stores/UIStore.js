import { observable, action } from 'mobx';

class UIStore {
    @observable connecting = true;
    @observable connectedToRoom = false;
    @observable connectingToRoom = false;
    @observable requireLogin = false;
    @observable currentUsername = null;
    @observable onlinePlayers = 1;
    @observable lobbyRooms = null;
    @observable modal = {
        visible: false,
        element: null
    }
    @observable volume = 100;

    constructor( rootStore ) {
        this.rootStore = rootStore;
        const savedVolume = localStorage.getItem( 'volume' );
        if( savedVolume !== null ) {
            this.volume = savedVolume;
        }
    }

    @action showModal = ( element ) => {
        this.modal.visible = true;
        this.modal.element = element;
    }

    @action closeModal = () => {
        this.modal.visible = false;
        this.modal.element = null;
    }
}

export default UIStore;