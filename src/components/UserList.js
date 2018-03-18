import React, { Component } from 'react';
import { action } from 'mobx';
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
    @action clickUsers = ( e ) => {
        e.preventDefault();
        const { roomStore } = this.props.rootStore;

        if( roomStore.keyboardOpen ) {
            roomStore.forceShowUsers = !roomStore.forceShowUsers;
        }
    }

    render() {
        const { roomStore, canvasStore } = this.props.rootStore;
        const showUsers = !roomStore.usersHidden || roomStore.forceShowUsers;
        const showGuesses = roomStore.usersGuessed > 0 && !showUsers;
        const headerText = showGuesses ? `${roomStore.usersGuessed}/${roomStore.users.size-1} GUESSED` : 'PLAYERS';
        const playercountText = `${roomStore.users.size}/${roomStore.roomMaxPlayers}`; 

        const containerClasses = classNames( {
            'c-users u-flex-columns': true,
            'c-users--minimised': roomStore.usersHidden,
            'c-users--maximised': roomStore.usersHidden && roomStore.forceShowUsers
        } );
        const headerClasses = classNames( {
            'c-users__header u-flex': true,
            'c-users__header--guesses': showGuesses 
        } );
        const playercountClasses = classNames( {
            "c-users__playercount": true,
            'u-display-none': showGuesses
        } );

        const userStyles = {
            marginTop: ( canvasStore.landscape && !roomStore.keyboardOpen ) ? canvasStore.headerHeight : null
        };
        
        return (
            <div className={containerClasses} style={userStyles} onMouseDown={this.clickUsers}>
                <div className={headerClasses}>
                    <span className="c-users__headertitle">{headerText}</span>
                    <span className={playercountClasses}>{playercountText}</span>
                </div>
                { showUsers && 
                    <div className="c-users__list u-flex-columns">
                    {
                        roomStore.users.values().map( user => (
                            <User key={user.id} user={user} />
                        ) )
                    }
                    </div>
                }
            </div>
        );
    }
}

export default UserList;