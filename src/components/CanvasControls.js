import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { action, observable } from 'mobx';
import classNames from 'classnames';
import CanvasWordPicker from 'CanvasWordPicker';

export const WINDOW_WORDPICKER = 1;
export const WINDOW_LEADERBOARD = 2;
const WINDOW_BRUSHCOLOUR = 3;
const WINDOW_FILLCOLOUR = 4;
const WINDOW_BRUSHSIZE = 5;

const SIZES = [ 3, 5, 7, 9, 11, 13, 15, 17 ];

//Distinct colours taken from these sites (with some additions/changing colours to fit website palette)
//http://stackoverflow.com/questions/470690/how-to-automatically-generate-n-distinct-colors
//http://alumni.media.mit.edu/~wad/color/palette.html
const COLOURS = [
    '#000',
    '#575757',
    '#a0a0a0',
    '#9C27B0',
    '#9dafff',
    '#2a4bd7',
    '#29d0d0',
    '#81c57a',
    '#4CAF50',
    '#C6FF00',
    '#ffee33',
    '#ff9233',
    '#e9debb',
    '#814a19',
    '#F8BBD0',
    '#F44336',
    '#ad2323',
    '#fff'
];

const Button = props => {
    const outer = classNames( { 
        'c-canvas-controls__option u-flex-columns u-flex-center-all': true,
        'c-canvas-controls__option--disabled': props.disabled,
        'c-canvas-controls__option--drawing': props.drawing
    } );
    const inner = classNames( {
        'c-canvas-controls__button u-flex-center-all': true,
        'c-canvas-controls__button--active': props.enabled,
        'c-canvas-controls__button--disabled': props.disabled,
        'c-canvas-controls__button--drawing': props.drawing
    } );
    return ( 
        <div className={outer} onClick={props.click}>
            <div className={inner} style={{ backgroundColor: props.colour }}>
                {props.children}
            </div>
            <span className="c-canvas-controls__label">{props.name}</span>
        </div> 
    );
}

const LeaderboardItem = props => (
    <div className={"c-scoreboard__user u-flex-center" + (props.winner ? ' c-scoreboard__user--winner' : '')}>
        <span className="c-scoreboard__name u-truncate">{props.nick}</span>
        <span className="c-scoreboard__score">{props.score}</span>
    </div>
)

@inject('rootStore', 'socket') @observer
class Leaderboard extends Component {
    render() {
        const highScore = this.props.scores[ 0 ].score;
        return (
            <div className="c-scoreboard u-flex-columns u-flex-center-all">
                <span className="c-scoreboard__heading">{this.props.msg}</span>
                {this.props.scores.map(user => {
                    return <LeaderboardItem key={user.nick} nick={user.nick} score={user.score} winner={user.score === highScore} />;
                })}
            </div>
        )
    }
}

const SizeButton = props => {
    const c = classNames( {
        'c-canvas-controls__button c-canvas-controls__button--size u-flex-center-all': true,
        'c-canvas-controls__button--active': props.active
    });
    return (
        <div className={c} onClick={props.click}>
            <div className={'c-size c-size--' + props.size}></div>
        </div>
    )
}

const PaletteButton = props => {
    const c = classNames( {
        'c-canvas-controls__button c-canvas-controls__button--picker u-flex-center-all': true,
        'c-canvas-controls__button--active': props.active
    });
    return (
        <div className={c} onClick={props.click} style={{ backgroundColor: props.colour }}></div>
    )
}

@inject('rootStore','socket') @observer
class SizeWindow extends Component {
    @action changeSize = ( size ) => {
        const { canvasStore, roomStore } = this.props.rootStore;
        
        canvasStore.brushSize = size;
        roomStore.canvasWindow = 0;
    }

    render() {
        const { canvasStore } = this.props.rootStore;
        return (
            <div className="c-canvas-controls__category c-canvas-controls__category--left c-canvas-controls__category--above u-flex">
                {SIZES.map( ( size ) => {
                    return <SizeButton key={size} size={size} click={() => this.changeSize( size )} active={size === canvasStore.brushSize} />;
                } ) }
            </div>
        );
    }
}


@inject('rootStore','socket') @observer
class PaletteWindow extends Component {
    @action changeColour = ( colour ) => {
        const { canvasStore, roomStore } = this.props.rootStore;
        const { socket } = this.props;

        if( this.props.brush ) {
            canvasStore.brushColour = colour;
            canvasStore.eraserEnabled = false;
        } else if( this.props.fill ) {
            canvasStore.fillColour = colour;
            
            if( colour === '#000' ) {
                canvasStore.brushColour = '#fff';
            } else if( canvasStore.brushColour === '#fff' ) {
                canvasStore.brushColour = '#000';
            }

            socket.emit( 'fillCanvas', colour );
        }

        roomStore.canvasWindow = 0;
    }

    render() {
        const { canvasStore } = this.props.rootStore;
        const outer = classNames( {
            "c-canvas-controls__category c-canvas-controls__category--above c-canvas-controls__category--palette u-flex": true,
            'c-canvas-controls__category--left': this.props.brush,
            'c-canvas-controls__category--right': this.props.fill
        } );
        const enabled = ( this.props.brush && canvasStore.brushColour ) || ( this.props.fill && canvasStore.fillColour );
        return (
            <div className={outer}>
                { COLOURS.map( ( colour ) => {
                    return <PaletteButton key={colour} colour={colour} active={enabled === colour} click={() => this.changeColour( colour )} />;
                } )} 
            </div>
        );
    }
}

const Window = props => {
    switch ( props.show ) {
        case WINDOW_WORDPICKER:
            return <CanvasWordPicker />;
        case WINDOW_LEADERBOARD:
            return <Leaderboard scores={props.scores} msg={props.msg} />;
        case WINDOW_BRUSHSIZE:
            return <SizeWindow />;
        case WINDOW_BRUSHCOLOUR:
            return <PaletteWindow brush/>;
        case WINDOW_FILLCOLOUR:
            return <PaletteWindow fill/>;
        default:
            return null;
    }
}

@inject('rootStore','socket') @observer
class CanvasOverlay extends Component {
    @observable scores = [];
    @observable scoreMessage = '';

    componentDidMount() {
        const { socket } = this.props;
        socket.on( 'showScoreboard', this.showScoreboard );
    }

    @action showScoreboard = ( users, msg ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        this.scores = JSON.parse( users );
        this.scoreMessage = msg;
        roomStore.canvasWindow = WINDOW_LEADERBOARD;
        canvasStore.timerCentered = false;
    }

    @action undoLines = () => {
        const { canvasStore } = this.props.rootStore;
        const { socket } = this.props;
        if( canvasStore.undoEnabled ) {
            socket.emit( 'undoLines', canvasStore.undoValue );
            canvasStore.undoValue = 0;
        }
    }

    @action toggleCanvasWindow = ( window ) => {
        const { roomStore } = this.props.rootStore;
        if( window && roomStore.canvasWindow !== window ) {
            roomStore.canvasWindow = window;
        } else {
            roomStore.canvasWindow = 0;
        }
    }

    render() {
        const { roomStore, canvasStore } = this.props.rootStore;
        const left = classNames( { 
            'c-canvas-controls__category c-canvas-controls__category--left u-flex': true,
            'u-hidden': ( !roomStore.currentDrawer ),
            'c-canvas-controls__category--drawing': canvasStore.mouseDown
        } );
        const right = classNames( { 
            'c-canvas-controls__category c-canvas-controls__category--right u-flex': true,
            'u-hidden': ( !roomStore.currentDrawer ),
            'c-canvas-controls__category--drawing': canvasStore.mouseDown
        } );
        const timer = classNames( { 
            'c-canvas-timer u-flex-center-all': true,
            'c-canvas-timer--centered': canvasStore.timerCentered,
            'u-hidden': !canvasStore.timerVisible
        } )
        const overlay = classNames( {
            'c-canvas-overlay u-flex-center-all': true
        } );
        return (
            <div className="c-canvas-controls u-flex-center-all u-no-select">
                
                <div className={overlay} style={{ top: canvasStore.headerHeight }}>
                    <div className={timer}>
                        {canvasStore.timerSeconds}
                    </div>
                    <Window show={roomStore.canvasWindow} scores={this.scores} msg={this.scoreMessage} />
                </div>
                <div className={left}>
                    <Button 
                        name="Size"
                        enabled={roomStore.canvasWindow === WINDOW_BRUSHSIZE}
                        drawing={canvasStore.mouseDown} 
                        click={() => this.toggleCanvasWindow( WINDOW_BRUSHSIZE )}
                    >
                        <div className={'c-size c-size--' + canvasStore.brushSize }></div>
                    </Button>
                    <Button 
                        name="Colour" 
                        colour={canvasStore.brushColour}
                        enabled={roomStore.canvasWindow === WINDOW_BRUSHCOLOUR} 
                        drawing={canvasStore.mouseDown} 
                        click={() => this.toggleCanvasWindow( WINDOW_BRUSHCOLOUR )}
                    />
                    <Button name="Eraser" enabled={canvasStore.eraserEnabled} drawing={canvasStore.mouseDown}  click={canvasStore.toggleEraser}>
                        <i className="c-canvas-controls__icon icon-eraser" />
                    </Button>
                </div>
                <div className={right}>
                    <Button name="Undo" disabled={!canvasStore.undoEnabled} drawing={canvasStore.mouseDown}  click={this.undoLines}>
                        <i className="c-canvas-controls__icon icon-ccw" />
                    </Button>
                    <Button 
                        name="Clear"
                        enabled={roomStore.canvasWindow === WINDOW_FILLCOLOUR} 
                        drawing={canvasStore.mouseDown} 
                        click={() => this.toggleCanvasWindow( WINDOW_FILLCOLOUR )}
                    >
                        <i className="c-canvas-controls__icon icon-cancel" />
                    </Button>
                </div>
            </div>
        );
    }
}

export default CanvasOverlay;