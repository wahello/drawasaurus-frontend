import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action } from 'mobx';
import { initSounds } from 'api/Audio';

@inject('rootStore','socket') @observer
class LoginForm extends Component {
    @observable username = '';

    componentDidMount() {
        this.textInput.focus();
    }

    @action handleUsernameChange = ( event ) => {
        this.username = event.target.value;
    }

    handleSubmit = ( event ) => {
        event.preventDefault();
        const { uiStore, roomStore } = this.props.rootStore;
        const { socket } = this.props;
        if( this.username !== '' ) {
            this.props.socket.emit( 'submitUsername', this.username );

            if ( roomStore.roomName ) {
               socket.emit( 'joinRoom', roomStore.roomName );
            }

            uiStore.closeModal();
        } else {
            //Give random name?
        }
    }

    render() {
        return (
            <div className="c-login u-flex-center-all">
                <div className="c-login__main u-flex-columns u-flex-center-all">
                    <span className="c-login__welcome">Welcome to</span>
                    <span className="c-login__title">Drawasaurus!</span>
                    <form className="c-login__form u-flex-center-all" onSubmit={this.handleSubmit}>
                        <input className="c-login__input" 
                            ref={input => this.textInput = input}
                            placeholder="Enter any nickname"
                            value={this.username}
                            onChange={this.handleUsernameChange} 
                            maxLength="12"
                            autoComplete="off" 
                            spellCheck="false"
                            autoFocus />
                        <input type="submit" onClick={initSounds} className="c-login__submit" value="Play Game" />
                    </form>
                </div>
                <div className="c-login__info">
                    <p className="c-login__desc"><strong>Drawasaurus</strong> is a drawing & guessing game for your phone, tablet or PC. 
                    Do your best to draw the word you are given while players from around the world try to guess it!</p>
                    <div className="c-login__rules">
                        <div className="c-login__rule u-flex-center">
                            <span className="c-login__bullet">•</span>
                            Avoid drawing words and letters.
                        </div>
                        <div className="c-login__rule u-flex-center">
                            <span className="c-login__bullet">•</span>
                            Be polite and have fun!
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default LoginForm;