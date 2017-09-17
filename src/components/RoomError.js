import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action } from 'mobx';
import classNames from 'classnames';

const Button = props => (
    <div className={"c-room-error__button" + ( props.ok ? ' c-room-error__button--afk' : '' )} onClick={props.click}>
        <i className={"c-room-error__icon icon-" + props.icon}></i>
    </div>
)

@inject('rootStore','socket') @observer
class RoomError extends Component {
    componentWillMount() {
        const { socket } = this.props;
        socket.on( 'roomError', this.roomError );
    }

    @action roomError = ( msg ) => {
        const { roomStore } = this.props.rootStore;
        if( msg.indexOf( 'AFK' ) !== -1 )
        {
            roomStore.kicked = true;
        }
        roomStore.errorMessage = msg;
        roomStore.errorButtons = [ true, false, true ];
    }

    clickBack = () => {
        window.location.href = '/';
    }

    @action clickOk = () => {
        const { roomStore } = this.props.rootStore;
        roomStore.timeAFK = 0;
        roomStore.errorMessage = '';
    }

    clickRefresh = () => {
        window.location.reload();
    }

    render() {
        const { roomStore } = this.props.rootStore;
        const c = classNames( {
            'c-room-error u-flex-center-all': true,
            'c-room-error--hidden': roomStore.errorMessage === ''
        })
        const window = classNames( {
            'c-room-error__window u-flex-center-all': true,
            'c-room-error__window--afk': roomStore.errorButtons[1]
        } );
        return (
            <div className={c}>
                <div className={window}>
                    {roomStore.errorButtons[0] && 
                        <Button icon="left-circled" click={this.clickBack} />
                    }
                    <span className="c-room-error__text">
                       {roomStore.errorMessage}
                    </span>
                    {roomStore.errorButtons[1] &&
                        <Button icon="ok-circled" click={this.clickOk} ok />
                    }
                    {roomStore.errorButtons[2] &&
                        <Button icon="arrows-cw" click={this.clickRefresh} />
                    }
                </div>
            </div>
        );
    }
}

export default RoomError;