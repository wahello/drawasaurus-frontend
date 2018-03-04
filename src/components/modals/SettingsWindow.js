import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action } from 'mobx';
import { sndGuessingOver } from 'api/Audio';
import Slider from 'react-rangeslider';
import 'styles/Slider.scss';

@inject('rootStore','socket') @observer
class SettingsWindow extends Component {
    @observable username = '';
    @observable volume = 100;

    constructor( props ) {
        super( props );
        const { uiStore } = props.rootStore;
        this.username = uiStore.currentUsername;
        this.volume = uiStore.volume;
    }

    componentDidMount() {
        this.textInput.focus();
    }

    selectText = ( e ) => {
        e.target.select();
    }

    @action handleNameChange = ( e ) => {
        this.username = e.target.value;
    }

    @action handlePlayersChange = ( value ) => {
        this.volume = Math.min( Math.max( value, 0 ), 100 );
    }

    testVolume = () => {
        sndGuessingOver.play( sndGuessingOver.getVolume() * ( this.volume / 100 ), true );
    }

    saveChanges = ( e ) => {
        e.preventDefault();
        const { uiStore } = this.props.rootStore;
        const { socket } = this.props;

        if( this.username !== uiStore.currentUsername ) {
            socket.emit( 'changeUsername', this.username );
        }

        uiStore.volume = this.volume;
        localStorage.setItem( 'volume', this.volume );

        uiStore.closeModal();
    }

    render() {
        const { uiStore } = this.props.rootStore;
        return (
            <div className="c-modal__window">
                <div className="c-modal__header u-flex-center">
                    <i className="c-modal__icon icon-cog" />
                    <span className="c-modal__title">Settings</span>
                    <i onClick={uiStore.closeModal} className="c-modal__close icon-cancel-circled" />
                </div>
                <form onSubmit={this.saveChanges} className="c-settings u-flex-columns">
                    <div className="c-settings__row u-flex-center-all">
                        <span className="c-settings__label">Username:</span>
                        <input 
                            className="c-settings__input" 
                            type="text"
                            ref={input => this.textInput = input}
                            placeholder="Enter a nickname"
                            value={this.username}
                            onChange={this.handleNameChange}
                            onFocus={this.selectText}
                            maxLength="12"
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </div>
                    <div className="c-settings__row u-flex-columns u-flex-center-all">
                        <div className="c-settings__valuerow u-flex-center">
                            <span className="c-settings__label">Sound Effects Volume:</span>
                        </div>
                        <Slider
                            min={0}
                            max={100}
                            labels={ { 0: 'Off', 25: '25%', 50: '50%', 75: '75%', 100: '100%' } }
                            value={this.volume} 
                            onChange={this.handlePlayersChange}
                            onChangeComplete={this.testVolume} />
                    </div>
                    <button type="submit" className="c-settings__save">Save</button>
                </form>
            </div>
        );
    }
}

export default SettingsWindow;