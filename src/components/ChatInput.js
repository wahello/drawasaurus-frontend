import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action } from 'mobx';
import mobileDetect from 'mobile-detect';
import { initSounds } from 'api/Audio';

const USING_MOBILE = new mobileDetect( window.navigator.userAgent ).mobile();
const USING_IOS = !isNaN( new mobileDetect( window.navigator.userAgent ).version('iOS') );

@inject('rootStore','socket') @observer
class ChatInput extends Component {
    constructor( props ) {
        super( props );
        this.state = { 
            value: '', 
            showPlaceholder: true
        }
    }

    @action updateKeyboard = ( bool ) => {
        const { roomStore } = this.props.rootStore;
        initSounds();
        if( USING_MOBILE ) {
            roomStore.keyboardOpen = bool;
        }
    }

    handleChange = ( e ) => {
        this.setState( { value: e.target.value } );
    }

    sendMessage = ( e ) => {
        e.preventDefault();
        const { socket } = this.props;
        let msg = this.state.value.trim();
        if( msg !== '' ) {
            socket.emit( 'chat', msg );
            this.setState( { 
                value: '', 
                showPlaceholder: false 
            } );
        }
    }

    render() {
        return (
            <form onSubmit={this.sendMessage} className="c-chat__box">
                <input
                    className="c-chat__input"
                    placeholder={this.state.showPlaceholder ? 'Chat or guess' : ''}
                    maxLength="150"
                    autoComplete="off"
                    type="text"
                    value={this.state.value}
                    onChange={this.handleChange}
                    onFocus={() => this.updateKeyboard(true)}
                    onBlur={() => this.updateKeyboard(false)}
                />
            </form>
        );
    }
}

export default ChatInput;