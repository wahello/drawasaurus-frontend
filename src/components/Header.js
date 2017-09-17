import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import RoomInfoWindow from 'modals/RoomInfoWindow';
import SettingsWindow from 'modals/SettingsWindow';
import Logo from 'images/logo.svg';
import 'styles/Header.scss';

@inject('rootStore') @observer
class Header extends Component {
    render() {
        const { uiStore, roomStore } = this.props.rootStore;
        return (
            <header className="c-header u-flex u-no-select">
                <a href="/" className="c-header__home u-header-item u-header-item--left u-flex-center">
                    <img className="c-logo" alt="Drawasaurus Logo" src={Logo} height="20" width="20" />
                    {!uiStore.connectedToRoom &&
                        <div className="c-header__sitename">Drawasaurus</div>
                    }
                </a>
                {uiStore.connectedToRoom && 
                    <div onClick={() => uiStore.showModal( <RoomInfoWindow /> )} className="c-header__room u-header-item u-header-item--left u-flex-columns">
                        <p className="c-header__roomname">{roomStore.displayRoomName}</p>
                        <p className="c-header__roomstatus">{roomStore.headerStatus}</p>
                    </div>
                }
                {uiStore.currentUsername &&
                    <div onClick={() => uiStore.showModal( <SettingsWindow /> )} className="c-header__user u-header-item u-header-item--right u-flex-center-all">
                        <i className="icon-user-circle-o c-header__usericon" />
                        <span className="c-header__username">{uiStore.currentUsername}</span>
                    </div>
                }
            </header>
        );
    }
}

export default Header;