import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { getRoomName, getRoomURL } from 'Lobby';
import classNames from 'classnames';

const RoomButton = observer( props => {
    const classes = classNames( {
        "c-room-button u-flex": true,
        "c-room-button--full": props.full
    } );
    return (
        <button onClick={() => props.loadRoom( props.name )} className={classes}>
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
    );
 } );

@inject('rootStore') @observer
class RoomList extends Component {
    loadRoom = ( roomName ) => {
        window.location.href = getRoomURL( roomName );
    }

    render() {
        const { uiStore } = this.props.rootStore;
        const openRooms = uiStore.lobbyRooms !== null ? uiStore.lobbyRooms.filter( room => room.c !== room.m ) : [];
        const fullRooms = uiStore.lobbyRooms !== null ? uiStore.lobbyRooms.filter( room => room.c === room.m ) : [];
        return (
            <div className="c-lobby-rooms u-flex-columns u-flex-center-all u-no-select">
                {( uiStore.connecting || uiStore.lobbyRooms === null ) &&
                    <div className="c-spinner" />
                }
                {(!uiStore.connecting && uiStore.lobbyRooms !== null && uiStore.lobbyRooms.length === 0) &&
                    <div className="c-lobby-rooms__none">
                        <p>
                            No rooms are open, create one above
                            <br />
                            and use the link to invite other players!
                        </p>
                    </div>
                }
                {openRooms.length > 0 && openRooms.map( room => (
                    <RoomButton loadRoom={this.loadRoom} key={room.n} name={room.n} status={room.s} currentPlayers={room.c} maxPlayers={room.m} />
                ) )}
                {(openRooms.length === 0 && fullRooms.length > 0) &&
                    <div className="c-lobby-rooms__none c-lobby-rooms__none--full">
                        <p>
                            All rooms are currently full, create a
                            <br />
                            new one above or wait for a spot to open!
                        </p>
                    </div>
                }
                {( fullRooms.length > 0 && openRooms.length > 0 ) &&
                    <div className="c-lobby-rooms__full-text">
                        <p>FULL ROOMS</p>
                    </div>
                }
                {fullRooms.length > 0 && fullRooms.map( room => (
                    <RoomButton loadRoom={this.loadRoom} key={room.n} name={room.n} status={room.s} currentPlayers={room.c} maxPlayers={room.m} full />
                ) )}
            </div>
        );
    }
}

export default RoomList;