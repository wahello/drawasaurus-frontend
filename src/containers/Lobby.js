import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action } from 'mobx';
import { IS_SSR } from 'api/UserAgent';
import CreateRoomWindow from 'modals/CreateRoomWindow';
import RoomList from 'RoomList';
import AFKTimer from 'AFKTimer';
import 'styles/Lobby.scss';
import 'styles/Spinner.scss';

export const getRoomName = ( name ) => {
    let n = Math.floor( Number( name ) );
    return ( String( n ) === name ) ? ( 'Room ' + name ) : name;
}

export const getRoomURL = ( name ) => {
    name = name.replace(/ /g, '+');
    return '/room/' + name;
}

@inject('rootStore') @observer
class OnlinePlayers extends Component {
    render() {
        const { uiStore } = this.props.rootStore;
        if( IS_SSR ) {
            return <span className="c-lobby-header__players">Loading game...</span>;
        } else if ( uiStore.connecting || uiStore.lobbyRooms === null ) {
            return <span className="c-lobby-header__players">Loading rooms...</span>;
        } else {
            return (
                <span className="c-lobby-header__players">
                    { uiStore.onlinePlayers }
                    { uiStore.onlinePlayers === 1 ? ' player ' : ' players '}
                    currently online
                </span>
            );
        }
    }
}

@inject('rootStore','socket') @observer
class Lobby extends Component {
    componentWillMount() {
        const { socket } = this.props;

        socket.on( 'refreshLobby', this.refreshLobby );
        socket.on( 'joinRoom', this.loadRoom );
        socket.on( 'disconnect', this.onDisconnect );
        socket.emit( 'requestLobby' );
    }

    componentWillUnmount() {
        document.removeEventListener( 'visibilitychange', this.visibilityChange, false );
    }

    @action onDisconnect = () => {
        const { uiStore } = this.props.rootStore;
        uiStore.connecting = true;
        uiStore.lobbyRooms = null;
        uiStore.onlinePlayers = 1;
    }

    @action refreshLobby = ( rooms, numPlayers ) => {
        const { uiStore } = this.props.rootStore;
        uiStore.lobbyRooms = JSON.parse( rooms );
        uiStore.onlinePlayers = numPlayers;
    }

    quickPlay = () => {
        const { socket } = this.props;
        socket.emit( 'requestQuickplay' );
    }

    loadRoom = ( roomName ) => {
        window.location.href = getRoomURL( roomName );
    }

    render() {
        const { uiStore } = this.props.rootStore;
        return (
            <div className="l-lobby u-flex-columns u-flex-center">
                <a style={{ display: "none" }} href="/room/">SSR</a>
                <div className="c-lobby-header u-flex-columns u-flex-center-all">
                    <span className="c-lobby-header__welcome">Welcome to</span>
                    <span className="c-lobby-header__name">Drawasaurus</span>
                    <OnlinePlayers />
                </div>
                <div className="c-lobby-buttons u-flex-center-all u-no-select">
                    <button onClick={this.quickPlay} className="c-lobby-button c-lobby-button--purple">
                        <i className="c-lobby-button__icon icon-pencil"></i>
                        <span className="c-lobby-button__label">Quick Play</span>
                    </button>
                    <button onClick={() => uiStore.showModal( <CreateRoomWindow /> )} className="c-lobby-button c-lobby-button--green">
                        <i className="c-lobby-button__icon icon-plus"></i>
                        <span className="c-lobby-button__label">Create Room</span>
                    </button>
                </div>
                <RoomList />
                <AFKTimer lobby />
            </div>
        );
    }
}

export default Lobby;