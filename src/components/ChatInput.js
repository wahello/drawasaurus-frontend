import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action, reaction } from 'mobx';
import { initSounds } from 'api/Audio';
import { USING_MOBILE, USING_IOS } from 'api/UserAgent';

@inject('rootStore','socket') @observer
class ChatInput extends Component {
    constructor( props ) {
        super( props );
        this.state = { 
            value: '', 
            showPlaceholder: true
        }
    }

    componentDidMount() {
        const { roomStore } = this.props.rootStore; 
        reaction( () => roomStore.lowestHeight,
            lowestHeight => {
                if( lowestHeight === true ) {
                    this.input.blur();
                }
            }
        );
    }

    @action updateKeyboard = ( bool ) => {
        const { roomStore } = this.props.rootStore;
        initSounds();
        
        if( USING_MOBILE ) {
            roomStore.keyboardOpen = bool;
        }

        if( !bool ) {
            roomStore.lowestHeight = null;
        }

        if( USING_IOS ) {
            roomStore.forceRefresh = true;
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
                    ref={input => this.input = input}
                    className="c-chat__input"
                    placeholder={this.state.showPlaceholder ? 'Guess and chat here' : ''}
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