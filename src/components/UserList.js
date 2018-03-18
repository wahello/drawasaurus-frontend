import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classNames from 'classnames';

@observer
class User extends Component {
    render() {
        const { user } = this.props;
        const c = classNames( {
            'c-users__user u-flex': true,
            'c-users__user--drawing': user.isDrawing === 1,
            'c-users__user--guessed': user.isDrawing === 2,
            'c-users__user--me': user.me
        } );
        return (
            <div className={c}>
                <span className="c-users__name u-truncate" title={user.nick}>{user.nick}</span>
                <span className="c-users__score">{user.currentScore}</span>
            </div>
        );
    }
}

@inject('rootStore') @observer
class UserList extends Component {
    render() {
        const { roomStore, canvasStore } = this.props.rootStore;
        const userStyles = canvasStore.landscape ? { marginTop: canvasStore.headerHeight } : {};
        return (
            <div className="c-users u-flex-columns" style={userStyles}>
                <div className="c-users__header u-flex">
                    <span>PLAYERS</span>
                    <span className="c-users__playercount">{roomStore.users.size}/{roomStore.roomMaxPlayers}</span>
                </div>
                <div className="c-users__list u-flex-columns">
                {
                    roomStore.users.values().map( user => (
                        <User key={user.id} user={user} />
                    ) )
                }
                </div>
            </div>
        );
    }
}

export default UserList;