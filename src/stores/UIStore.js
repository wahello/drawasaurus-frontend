import { observable, action } from 'mobx';

class UIStore {
    @observable connecting = true;
    @observable connectedToRoom = false;
    @observable requireLogin = false;
    @observable currentUsername = null;
    @observable onlinePlayers = 1;
    @observable lobbyRooms = [];
    @observable modal = {
        visible: false,
        element: null
    }

    constructor( rootStore ) {
        this.rootStore = rootStore;
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