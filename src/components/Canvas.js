import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { observable } from 'mobx';
import { action } from 'mobx';
import raf from 'raf';
import { ERASER_EXTRA } from 'CanvasStore';
import { initSounds } from 'api/Audio';

@inject('rootStore','socket') @observer
class Canvas extends Component {
    @observable canvasRect = null;

    constructor( props ) {
        super( props );

        this.mouseDrawing = false;
        this.mouseOutside = false;
        this.lastPoint = null;

        this.currentCanvas = [];
        this.drawnCanvas = 0;
        this.undoHistory = [];
    }

    componentWillMount() {
        const { socket } = this.props;

        socket.on( 'drawLine', this.drawLineServer );
        socket.on( 'drawCanvas', this.receiveCanvas );
        socket.on( 'fillCanvas', this.fillCanvas );
        socket.on( 'undoLines', this.receiveUndoLines );

        document.addEventListener( 'mouseup', this.onMouseUpOutside, false );
    }

    componentWillUnmount() {
        document.removeEventListener( 'mouseup', this.onMouseUpOutside, false );
    }

    componentDidMount() {
        this.canvasRect = this.canvas.getBoundingClientRect();
        raf( this.drawLoop );
    }

    //Redraw canvas when dimensions change
    @action componentDidUpdate() {
        const { canvasStore } = this.props.rootStore;
        this.drawCanvas( this.currentCanvas, canvasStore.fillColour )
    }

    //Draw lines as they're added to the array using requestAnimationFrame
    drawLoop = () => {
        if( this.currentCanvas.length > this.drawnCanvas ) {
            let line = this.currentCanvas[ this.drawnCanvas ];
            this.drawnCanvas++;
            this.drawLine( line );
        }
        raf( this.drawLoop );
    }

    //Receive canvas array (in JSON) from server and draw
    @action receiveCanvas = ( canvas, fill ) => {
        canvas = JSON.parse( canvas );
        this.drawCanvas( canvas, fill );
    }

    //Fill canvas and draw on it
    @action drawCanvas = ( canvas, fill ) => {
        const { canvasStore } = this.props.rootStore;

        canvasStore.fillColour = fill;

        this.currentCanvas = canvas;
        this.drawnCanvas = canvas.length;
        this.fillCanvas( fill, false );

        //Draw canvas lines on next animation frame
        raf( () => {
            for( let i = 0; i < this.currentCanvas.length; i++ ) {
                this.drawLine( this.currentCanvas[ i ] );
            }
        } );
    }

    //Fill canvas with a colour (optionally prevent deleting canvas array for redrawing)
    @action fillCanvas = ( colour, reset = true ) => {
        let { canvasStore } = this.props.rootStore;
        let context = this.canvas.getContext( '2d' );

        canvasStore.fillColour = colour;
        context.fillStyle = colour;
        context.fillRect( 0, 0, canvasStore.canvasWidth, canvasStore.canvasHeight );

        if( reset ) {
            this.currentCanvas.length = 0;
            this.drawnCanvas = 0;
            this.undoHistory.length = 0;
            canvasStore.undoValue = 0;
            canvasStore.eraserEnabled = false;
        }
    }

    //Receive amount of lines to undo, remove from array and redraw
    @action receiveUndoLines = ( lines ) => {
        const { roomStore, canvasStore } = this.props.rootStore;

        this.currentCanvas.splice( ( this.currentCanvas.length - lines ), lines );
        this.drawCanvas( this.currentCanvas, canvasStore.fillColour );

        if( roomStore.currentDrawer ) {
            this.undoHistory.pop();
            canvasStore.undoValue = this.undoHistory[this.undoHistory.length - 1];
        }
    }

    //Return x/y coords (relative to the canvas) from mouse or touch event
    @action getMousePos = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        if( canvasStore.updateCanvasBound ) {
            this.canvasRect = this.canvas.getBoundingClientRect();
            canvasStore.updateCanvasBound = false;
        }

        let x = e.pageX || ( e.touches && e.touches[ 0 ].pageX ) || null;
        let y = e.pageY || ( e.touches && e.touches[ 0 ].pageY ) || null;

        if( x === null ) {
            return null;
        }

        x = Math.round( x - this.canvasRect.left );
        y = Math.round( y - this.canvasRect.top );

        return [ x, y ];
    }
    
    //Receive line from server
    drawLineServer = ( line ) => {
        this.currentCanvas.push( line );
    }

    //Send line to server, queue to draw
    drawLineClient = ( line ) => {
        const { socket } = this.props;

        this.currentCanvas.push( line );
        socket.emit( 'drawLine', line );
    }

    //Use line object to draw on the canvas
    drawLine = ( line ) => {
        if( !line ) return;

        const { canvasStore } = this.props.rootStore;
        const { multWidth, multHeight } = canvasStore;
        let context = this.canvas.getContext( '2d' );
        
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = line.colour;
        //Scale line thickness with canvas size
        context.lineWidth = Math.round( line.thick * multWidth );
        context.beginPath();

        let x2 = Math.round( line.to.x * multWidth );
        let y2 = Math.round( line.to.y * multHeight );

        if( line.from ) {
            let x1 = Math.round( line.from.x * multWidth );
            let y1 = Math.round( line.from.y * multHeight );
            context.moveTo( x1, y1 ); 
        } else {
            context.moveTo( x2-1, y2 ); 
        }
        
        context.lineTo( x2, y2 );
        context.stroke();
    }

    //Create line from mouse movement
    getLineFromEvent = ( e, mouseMove ) => {
        const { canvasStore } = this.props.rootStore;
        const { multWidthReverse, multHeightReverse } = canvasStore;
        let pos = this.getMousePos( e );
        if( pos === null ) return;

        pos[ 0 ] *= multWidthReverse;
        pos[ 1 ] *= multHeightReverse;

        let thick = canvasStore.brushSize;
        if( canvasStore.eraserEnabled ) {
            thick += ERASER_EXTRA;
        }

        let point = { x: pos[ 0 ], y: pos[ 1 ] };
        point.x = Math.round( point.x );
        point.y = Math.round( point.y );

        let line = {};
        if ( !mouseMove || this.mouseOutside ) {
            line = { from: null, to: point, colour: canvasStore.cursorColour, thick: thick };
            if( this.mouseOutside ) {
                this.mouseOutside = false;
            }
        } else {
            line = { from: this.lastPoint, to: point, colour: canvasStore.cursorColour, thick: thick  };
        }

        this.lastPoint = point;

        return line;
    }
    
    @action mouseDraw = ( e, newMove ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        this.moveCursor( e, true );
        if( roomStore.currentDrawer && this.mouseDrawing ) {
            let line = this.getLineFromEvent( e, !newMove );

            if( newMove ) {
                this.undoHistory[ this.undoHistory.length ] =0;
            }
            this.undoHistory[ this.undoHistory.length - 1 ]++;
            canvasStore.undoValue = this.undoHistory[ this.undoHistory.length - 1 ];

            this.drawLineClient( line );
        }
    }

    moveCursor = ( e, mine ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        if( mine && !roomStore.currentDrawer ) return;

        let pos = this.getMousePos( e );
        if( pos === null ) return;

        canvasStore.showCursor( pos[0], pos[1] );
    }

    onMouseEnter = ( e ) => {
        if( this.mouseDrawing ) {
            this.mouseDraw( e, true );
        } else {
            this.moveCursor( e, true );
        }
    }

    onMouseUp = ( e ) => {
        this.mouseDrawing = false;
    }

    onMouseUpOutside = ( e ) => {
        if( this.mouseDrawing && this.mouseOutside ) {
            this.mouseDrawing = false;
            this.mouseOutside = false;
        }
    }

    cursorWait = false;
    //Limit mousemove and touchmove events for performance
    onMouseTouchMove = ( e ) => {
        e.preventDefault();
        if ( !this.cursorWait ) {
            this.cursorWait = true;
            this.mouseDraw( e, false );
            setTimeout( () => { this.cursorWait = false; }, 20 );
        }
    }

    //mousedown & touchstart
    onMouseTouchStart = ( e ) => {
        e.preventDefault();
        initSounds();
        const { roomStore } = this.props.rootStore;
        if ( roomStore.currentDrawer ) {
            this.mouseDrawing = true;
            this.mouseDraw( e, true );
        }
    }

    onMouseOut = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        this.mouseDraw( e, false );
        this.mouseOutside = true;
        canvasStore.hideCursor();
    }

    onTouchEnd = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        this.mouseDrawing = false;
        canvasStore.hideCursor();
    }

    onTouchCancel = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        this.mouseOutside = true;
        canvasStore.hideCursor();
    }

    render() {
        const { canvasStore } = this.props.rootStore;
        return (
            <canvas 
                ref={canvas => this.canvas = canvas} 
                className="c-canvas u-no-select" 
                width={canvasStore.canvasWidth} 
                height={canvasStore.canvasHeight}
                onMouseEnter={this.onMouseEnter}
                onTouchEnd={this.onTouchEnd}
                onMouseUp={this.onMouseUp}
                onTouchStart={this.onMouseTouchStart}
                onMouseDown={this.onMouseTouchStart}
                onTouchMove={this.onMouseTouchMove}
                onMouseMove={this.onMouseTouchMove}
                onTouchCancel={this.onTouchCancel}
                onMouseOut={this.onMouseOut}
            />
        );
    }
}

export default Canvas;