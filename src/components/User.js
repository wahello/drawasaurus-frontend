import React, { Component } from 'react';
import { observer } from 'mobx-react';
import classNames from 'classnames';

@observer
class User extends Component {
    render() {
        const { user } = this.props;
        const c = classNames( {
            'c-users__user u-flex': true,
            'c-users__user--drawing': user.isDrawing === 1,
            'c-users__user--guessed': user.isDrawing === 2
        } );
        return (
            <div className={c}>
                <span className="c-users__name u-truncate" title={user.nick}>{user.nick}</span>
                <span className="c-users__score">{user.currentScore}</span>
            </div>
        );
    }
}

export default User;