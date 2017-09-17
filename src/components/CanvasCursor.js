import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import classNames from 'classnames';

@inject('rootStore') @observer
class CanvasCursor extends Component {
    render() {
        const { canvasStore } = this.props.rootStore;
        const c = classNames( {
            'c-canvas-cursor u-no-select': true,
            'c-canvas-cursor--black': canvasStore.cursorBlack,
            'u-display-none': !canvasStore.cursorVisible
        } );
        return (
            <div 
                className={c} 
                style={{ 
                    background: canvasStore.cursorColour,
                    left: canvasStore.cursorLeft,
                    top: canvasStore.cursorTop,
                    width: canvasStore.cursorSize,
                    height: canvasStore.cursorSize
                }}
            />
        )
    }
}

export default CanvasCursor;