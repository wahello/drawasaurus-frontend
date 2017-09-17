import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import User from 'User';

@inject('rootStore') @observer
class UserList extends Component {
    render() {
        const { roomStore } = this.props.rootStore;
        return (
            <div className="c-users u-flex">
                {
                    roomStore.users.values().map( user => (
                        <User key={user.id} user={user} />
                    ) )
                }
            </div>
        );
    }
}

export default UserList;