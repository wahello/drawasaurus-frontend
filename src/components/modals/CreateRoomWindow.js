import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action } from 'mobx';
import Slider from 'react-rangeslider';
import 'styles/Slider.scss';

@inject('rootStore','socket') @observer
class CreateRoomWindow extends Component {
    @observable roomName = '';
    @observable maxPlayers = 8;

    componentDidMount() {
        this.textInput.focus();
    }

    selectText = ( e ) => {
        e.target.select();
    }

    @action handleNameChange = ( e ) => {
        this.roomName = e.target.value;
    }

    @action handlePlayersChange = ( value ) => {
        this.maxPlayers = Math.max( 1, value );
    }

    startRoom = ( e ) => {
        e.preventDefault();
        const { uiStore } = this.props.rootStore;
        const { socket } = this.props;

        let name = this.roomName.trim();
        name = name !== '' ? name : '1';
        socket.emit( 'createNewRoom', name, this.maxPlayers );
        uiStore.closeModal();
    }

    render() {
        const { uiStore } = this.props.rootStore;
        return (
            <div className="c-modal__window">
                <div className="c-modal__header u-flex-center">
                    <i className="c-modal__icon icon-plus" />
                    <span className="c-modal__title">Create Room</span>
                    <i onClick={uiStore.closeModal} className="c-modal__close icon-cancel-circled" />
                </div>
                <form onSubmit={this.startRoom} className="c-settings u-flex-columns">
                    <div className="c-settings__row u-flex-center-all">
                        <span className="c-settings__label">Room Name:</span>
                        <input 
                            className="c-settings__input" 
                            type="text"
                            ref={input => this.textInput = input}
                            placeholder="Enter a room name"
                            value={this.roomName}
                            onChange={this.handleNameChange}
                            onFocus={this.selectText}
                            maxLength="12"
                            spellCheck="false"
                            autoComplete="off" />
                    </div>
                    <div className="c-settings__row u-flex-columns u-flex-center-all">
                        <div className="c-settings__valuerow u-flex-center">
                            <span className="c-settings__label">Max Players:</span>
                        </div>
                        <Slider
                            min={0}
                            max={12}
                            labels={ { 0: '0', 2: '2', 4: '4', 6: '6', 8: '8', 10: '10', 12: '12' } }
                            value={this.maxPlayers} 
                            onChange={this.handlePlayersChange} />
                    </div>
                    <button type="submit" className="c-settings__save">
                        Create
                    </button>
                </form>
            </div>
        );
    }
}

export default CreateRoomWindow;