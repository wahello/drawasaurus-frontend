import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import CopyToClipboard from 'react-copy-to-clipboard';

@inject('rootStore') @observer
class RoomInfoWindow extends Component {
    selectText = ( e ) => {
        e.target.select();
    }

    onCopy = () => {
        this.textInput.select();
    }

    render() {
        const { uiStore, roomStore } = this.props.rootStore;
        return (
            <div className="c-modal__window">
                <div className="c-modal__header u-flex-center">
                    <i className="c-modal__icon icon-info-circled" />
                    <span className="c-modal__title">{roomStore.displayRoomName}</span>
                    <i onClick={uiStore.closeModal} className="c-modal__close icon-cancel-circled" />
                </div>
                <div className="c-settings u-flex-columns">
                    <div className="c-settings__row u-flex-center-all">
                        <input 
                            className="c-settings__input" 
                            type="text"
                            ref={input => this.textInput = input}
                            value={window.location}
                            onFocus={this.selectText}
                            autoComplete="off"
                            readOnly
                        />
                        <CopyToClipboard text={window.location} onCopy={this.onCopy}>
                            <button type="submit" className="c-settings__save c-settings__save--copy">Copy</button>
                        </CopyToClipboard>
                    </div>
                </div>
            </div>
        );
    }
}

export default RoomInfoWindow;