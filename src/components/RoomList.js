import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { getRoomName, getRoomURL } from 'Lobby';

const RoomButton = observer( props => (
    <button onClick={() => props.loadRoom( props.name )} className="c-room-button u-flex">
        <div className="c-room-button__desc u-flex-columns">
            <span className="c-room-button__name">{getRoomName(props.name)}</span>
            <span className="c-room-button__status">{props.status}</span>
        </div>
        <div className="c-room-button__players u-flex-columns u-flex-center-all">
            <i className="c-room-button__icon icon-user-circle-o"/>
            <span className="c-room-button__playercount">
            {props.currentPlayers}/{props.maxPlayers}
            </span>
        </div>
    </button>
) );

@inject('rootStore') @observer
class RoomList extends Component {
    loadRoom = ( roomName ) => {
        window.location.href = getRoomURL( roomName );
    }

    render() {
        const { uiStore } = this.props.rootStore;
        return (
            <div className="c-lobby-rooms u-flex-columns u-flex-center-all u-no-select">
                {( uiStore.connecting || uiStore.lobbyRooms === null ) &&
                    <div className="c-spinner" />
                }
                {(!uiStore.connecting && uiStore.lobbyRooms !== null && uiStore.lobbyRooms.length === 0) &&
                    <span className="c-lobby-rooms__none">
                        No rooms are open, create one above
                        <br />
                        and use the link to invite other players!
                    </span>
                }
                {uiStore.lobbyRooms !== null && uiStore.lobbyRooms.map( room => (
                    <RoomButton loadRoom={this.loadRoom} key={room.n} name={room.n} status={room.s} currentPlayers={room.c} maxPlayers={room.m} />
                ) )}
            </div>
        );
    }
}

export default RoomList;