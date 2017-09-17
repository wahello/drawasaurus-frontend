import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable, action } from 'mobx';

@inject('rootStore','socket') @observer
class SettingsWindow extends Component {
    @observable username = '';

    constructor( props ) {
        super( props );
        const { uiStore } = props.rootStore;
        this.username = uiStore.currentUsername;
    }

    componentDidMount() {
        this.textInput.focus();
    }

    selectText = ( e ) => {
        e.target.select();
    }

    @action handleChange = ( e ) => {
        this.username = e.target.value;
    }

    saveChanges = ( e ) => {
        e.preventDefault();
        const { uiStore } = this.props.rootStore;
        const { socket } = this.props;
        if( this.username !== uiStore.currentUsername ) {
            socket.emit( 'changeUsername', this.username );
        }
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
                            onChange={this.handleChange}
                            onFocus={this.selectText}
                            maxLength="12"
                            autoComplete="off"
                            spellCheck="false"
                        />
                    </div>
                    <button type="submit" className="c-settings__save">Save</button>
                </form>
            </div>
        );
    }
}

export default SettingsWindow;