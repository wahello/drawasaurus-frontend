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

        this.pendingLines = {
            lines: []
        };
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

    @action sendPendingLines = () => {
        if( this.pendingLines.lines.length === 0 ) return;

        const { socket } = this.props;
        const { canvasStore } = this.props.rootStore;

        socket.emit( 'drawLine', this.pendingLines );
        this.currentCanvas.push( this.pendingLines );
        this.pendingLines = { lines: [] };

        //Update undo history
        this.undoHistory[ this.undoHistory.length - 1 ] += 1;
        canvasStore.undoValue = this.undoHistory[ this.undoHistory.length - 1 ];
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

    //Create line from mouse movement
    getLineFromEvent = ( e, mouseMove ) => {
        const { canvasStore } = this.props.rootStore;
        const { multWidthReverse, multHeightReverse } = canvasStore;
        let pos = this.getMousePos( e );
        if( pos === null ) return;

        pos[ 0 ] *= multWidthReverse;
        pos[ 1 ] *= multHeightReverse;

        let point = { x: pos[ 0 ], y: pos[ 1 ] };
        point.x = Math.round( point.x );
        point.y = Math.round( point.y );

        let lines = [];
        if ( !mouseMove || this.mouseOutside ) {
            lines = [ [ point.x, point.y ] ];
            if( this.mouseOutside ) {
                this.mouseOutside = false;
            }
        } else {
            lines = [ [ this.lastPoint.x, this.lastPoint.y ], [ point.x, point.y ] ];
        }

        this.lastPoint = point;

        return lines;
    }

    //New drawing method with line smoothing
    drawLine = ( pending ) => {
        if( !pending ) return;

        const { canvasStore } = this.props.rootStore;
        const { multWidth, multHeight } = canvasStore;
        let context = this.canvas.getContext( '2d' );
        
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = pending.colour;
        //Scale line thickness with canvas size
        context.lineWidth = Math.round( pending.thick * multWidth );
        context.beginPath();

        let lines = pending.lines;
        let startX = lines[0][0] * multWidth;
        let startY = lines[0][1] * multHeight;
        context.moveTo(startX, startY);

        if( lines.length === 1 ) {
            context.lineTo( startX-1, startY );
        }

        for( var i = 1; i < lines.length - 2; i++ ) {
            let nextLine = lines[i + 1];
            let x1 = lines[i][0] * multWidth;
            let y1 = lines[i][1] * multHeight;
            let x2 = nextLine[0] * multWidth;
            let y2 = nextLine[1] * multHeight;

            let xc = (x1 + x2) / 2;
            let yc = (y1 + y2) / 2;

            context.quadraticCurveTo(x1, y1, xc, yc);
        }

        if( lines.length > 2 ) {
            let lastLine = lines[i + 1];
            let x1 = lines[i][0] * multWidth;
            let y1 = lines[i][1] * multHeight;
            let x2 = lastLine[0] * multWidth;
            let y2 = lastLine[1] * multHeight;

            context.quadraticCurveTo(x1, y1, x2, y2);
        }
        
        context.stroke();
    }
    
    @action mouseDraw = ( e, newMove ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        this.moveCursor( e, true );
        if( roomStore.currentDrawer && this.mouseDrawing ) {
            let lines = this.getLineFromEvent( e, !newMove );

            if( newMove ) {
                this.undoHistory.push( 0 );
                this.pendingLines.lines = [];
            }

            if( this.pendingLines.lines.length === 0 ) {
                let thick = canvasStore.brushSize;
                if( canvasStore.eraserEnabled ) {
                    thick += ERASER_EXTRA;
                }
                this.pendingLines.colour = canvasStore.cursorColour;
                this.pendingLines.thick = thick;
            } else {
                let lastLine = this.pendingLines.lines[ this.pendingLines.lines.length - 1 ];
                let line = lines[0];
                if( lastLine ) {
                    let x1 = lastLine[0];
                    let y1 = lastLine[1];
                    let x2 = line[0];
                    let y2 = line[1];

                    let a = x1 - x2;
                    let b = y1 - y2;
                    let distance = Math.sqrt( a*a + b*b );
                    if( distance <= 5 ) {
                        return;
                    }
                }
            }

            for( let i = 0; i < lines.length; i++ ) {
                this.pendingLines.lines.push( lines[i] );
            }

            if( this.pendingLines.lines.length >= 3 ) {
                this.sendPendingLines();
            }            
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
        this.sendPendingLines();
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
            setTimeout( () => { this.cursorWait = false; }, 8 );
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