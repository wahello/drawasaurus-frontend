import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classNames from 'classnames';
import ChatInput from 'ChatInput';

@observer
class Message extends Component {
    render() {
        if( this.props.message[0] === 0 ) {
            return ( 
                <div className="c-chat-message">
                    <span className="c-chat-message__name">{this.props.message[1]}:&nbsp;</span>
                    <span className="c-chat-message__text">{this.props.message[2]}</span>
                </div>
            );
        } else {
            //Hacky way to add link to intro message, probably a better way
            let msg = this.props.message[1];
            if ( msg.indexOf( '___ROOM_LINK___' ) !== -1 ) {
                let parts = msg.split( '___ROOM_LINK___' );
                return (
                    <div className="c-chat-message c-chat-message--notification u-flex-center">
                        <i className={"c-chat-message__icon icon-" + this.props.message[2]}></i>
                        <span className="c-chat-message__notification">{parts[0]}<a href="">this link</a>{parts[1]}</span>
                    </div>
                );
            } else {
                return (
                    <div className="c-chat-message c-chat-message--notification u-flex-center">
                        <i className={"c-chat-message__icon icon-" + this.props.message[2]}></i>
                        <span className="c-chat-message__notification">{msg}</span>
                    </div>
                );
            }
        }
    }
}

@inject('rootStore') @observer
class Chat extends Component {
    componentDidUpdate() {
        this.buffer.scrollTop = this.buffer.scrollHeight;
    }

    render() {
        const { roomStore } = this.props.rootStore;
        const c = classNames( {
            'c-chat u-flex-columns': true,
            'c-chat--no-users': roomStore.usersHidden
        } );
        return (
            <div className={c}>
                <div 
                    className="c-chat__buffer u-flex-columns"
                    ref={buffer => this.buffer = buffer}
                >
                    {
                        roomStore.messages.map( ( message, i ) => (
                            <Message key={i} message={message} />
                        ) )
                    }
                </div>
                <ChatInput />
            </div>
        );
    }
}

export default Chat;