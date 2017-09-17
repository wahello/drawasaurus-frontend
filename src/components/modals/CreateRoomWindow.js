import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action } from 'mobx';

@inject('rootStore','socket') @observer
class CreateRoomWindow extends Component {
    @observable roomName = '';

    componentDidMount() {
        this.textInput.focus();
    }

    selectText = ( e ) => {
        e.target.select();
    }

    @action handleChange = ( e ) => {
        this.roomName = e.target.value;
    }

    startRoom = ( e ) => {
        e.preventDefault();
        const { uiStore } = this.props.rootStore;
        const { socket } = this.props;

        let name = this.roomName.trim();
        if ( name !== '' ) {
            socket.emit( 'createNewRoom', name );
            uiStore.closeModal();
        }
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
                            onChange={this.handleChange}
                            onFocus={this.selectText}
                            maxLength="12"
                            spellCheck="false"
                            autoComplete="off" />
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