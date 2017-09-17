import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';

const Word = ( { word, click } ) => (
    <div className="c-canvas-overlay__word" onClick={click}>
        <span>{word[0]}</span>
    </div>
)

@inject('rootStore','socket') @observer
class CanvasWordPicker extends Component {
    pickWord = ( id ) => {
        const { socket } = this.props;
        socket.emit( 'chooseWord', id );
    }

    render() {
        const { roomStore } = this.props.rootStore;
        return (
            <div className="c-canvas-overlay__window u-flex-columns u-flex-center-all">
                <span className="c-canvas-overlay__title">Choose a word to draw</span>
                <div className="c-canvas-overlay__inner u-flex-center-all">
                    {
                        roomStore.wordChoices.map( ( word, i ) => (
                            <Word key={i} word={word} click={() => this.pickWord( i )} />
                        ) )
                    }
                </div>
            </div>
        );
    }
}

export default CanvasWordPicker;