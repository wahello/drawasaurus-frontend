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

        this.currentCanvas = [];
        this.drawnCanvas = 0;
        this.undoHistory = [];

        this.lastSendPending = 0;

        this.previewedLines = false;
        this.previewTime = null;

        //Track point of mouse outside canvas
        this.lastMouseOutside = null;

        this.pendingLines = {
            lines: []
        };
        this.pendingPreview = [];

        this.nextLineDraw = null;
    }

    componentWillMount() {
        const { socket } = this.props;

        socket.on( 'drawLine', this.drawLineServer );
        socket.on( 'drawCanvas', this.receiveCanvas );
        socket.on( 'fillCanvas', this.fillCanvas );
        socket.on( 'undoLines', this.receiveUndoLines );

        document.addEventListener( 'mouseup', this.onMouseUpOutside, false );
        document.addEventListener( 'mousemove', this.mouseMoveOutside, false );
        document.addEventListener( 'touchmove', this.mouseMoveOutside, false );
    }

    componentWillUnmount() {
        document.removeEventListener( 'mouseup', this.onMouseUpOutside, false );
        document.removeEventListener( 'mousemove', this.mouseMoveOutside, false );
        document.removeEventListener( 'touchmove', this.mouseMoveOutside, false );
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
        if( this.nextLineDraw !== null && Date.now() < this.nextLineDraw ) {
            raf( this.drawLoop );
            return;
        }

        if( this.currentCanvas.length > this.drawnCanvas ) {
            let line = this.currentCanvas[ this.drawnCanvas ];
            this.drawLine( line, this.drawnCanvas );
            this.drawnCanvas++;

            //Timestamp on line tells us how many ms to wait before drawing the next one
            if( typeof( line.t ) !== 'undefined' ) {
                this.nextLineDraw = Date.now() + Math.min( 200, line.t );
            }
        }

        raf( this.drawLoop );
    }

    @action previewPendingLines = () => {
        if( this.pendingPreview.length === 0 ) return;
        const { canvasStore } = this.props.rootStore;

        this.undoHistory[ this.undoHistory.length - 1 ] += 1;
        canvasStore.undoValue = this.undoHistory[ this.undoHistory.length - 1 ];

        let now = Date.now();
        var time = 0;
        if( this.pendingPreview.length <= this.pendingLines.lines.length && this.previewTime !== null ) {
            time = now - this.previewTime;
            let insert = this.pendingLines.lines.length - this.pendingPreview.length;
            this.pendingLines.lines.splice( insert, 0, time );

            this.previewTime = now;
        } else {
            this.previewTime = now;
        }


        let line = {};
        if( this.previewedLines ) {
            line = { lines: this.pendingPreview };
        } else {
            let thick = canvasStore.brushSize;
            if( canvasStore.eraserEnabled ) {
                thick += ERASER_EXTRA;
            }
            let colour = canvasStore.cursorColour;

            line = {
                colour: colour,
                thick: thick,
                lines: this.pendingPreview
            };
        }

        this.currentCanvas.push( line );
        this.pendingPreview = [];
    }

    @action sendPendingLines = () => {
        if( this.pendingLines.lines.length === 0 ) return;

        const { socket } = this.props;

        socket.emit( 'drawLine', this.pendingLines );
        this.pendingLines = { lines: [] };
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
                this.drawLine( this.currentCanvas[ i ], i );
            }
        } );
    }

    //Fill canvas with a colour (optionally prevent deleting canvas array for redrawing)
    @action fillCanvas = ( colour, reset = true ) => {
        let { canvasStore } = this.props.rootStore;
        let context = this.canvas.getContext( '2d', { alpha: false } );

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
            canvasStore.undoValue = this.undoHistory[ this.undoHistory.length - 1 ];
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
    
    //Receive lines from server
    drawLineServer = ( line ) => {
        //Seperate points in to the same blocks used when drawing real-time
        let pendingLine = { lines: [] };

        if( line.lines.length > 0 && typeof( line.lines[0].colour ) !== 'undefined' ) {
            pendingLine.colour = line.colour;
            pendingLine.thick = line.thick;
        }

        for( let i = 0; i < line.lines.length; i++ ) {
            let item = line.lines[ i ];
            if( Array.isArray( item ) ) {
                pendingLine.lines.push( item );

                if( i === 0 && typeof( line.colour ) !== 'undefined' ) {
                    pendingLine.colour = line.colour;
                    pendingLine.thick = line.thick;
                }

                if( i === line.lines.length - 1 ) {
                    this.currentCanvas.push( pendingLine );
                }
            } else {
                if( pendingLine.lines.length === 0 ) continue;
                //Timestamp after each block tells us how many ms to wait between drawing lines
                pendingLine.t = item;
                this.currentCanvas.push( pendingLine );
                pendingLine = { lines: [] };
            }
        }
    }

    //Create line from mouse movement
    getLineFromEvent = ( e, mouseMove ) => {
        const { canvasStore } = this.props.rootStore;
        const { multWidthReverse, multHeightReverse } = canvasStore;
        let pos = this.getMousePos( e );
        if( pos === null ) return null;

        let x = Math.round( pos[ 0 ] *= multWidthReverse );
        let y = Math.round( pos[ 1 ] *= multHeightReverse );

        return [ x, y ];
    }

    //New drawing method with line smoothing
    drawLine = ( pending, index ) => {
        if( !pending ) return;

        const { canvasStore } = this.props.rootStore;
        const { multWidth, multHeight } = canvasStore;
        let context = this.canvas.getContext( '2d', { alpha: false } );
        
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.strokeStyle = pending.colour;
        //Scale line thickness with canvas size
        context.lineWidth = Math.round( pending.thick * multWidth );
        context.lineWidth = Math.max( context.lineWidth, 2 );
        context.beginPath();

        let lines = pending.lines;

        //If line is continuous grab last point of previous line for smoothing
        if( !pending.hasOwnProperty( 'colour' ) ) {
            let lastLine = this.currentCanvas[ index - 1 ];
            lines.unshift( lastLine.lines[ lastLine.lines.length - 1 ] );
        }

        let startX = Math.round( lines[0][0] * multWidth );
        let startY = Math.round( lines[0][1] * multHeight );
        context.moveTo( startX, startY );

        if( lines.length === 1 ) {
            context.lineTo( startX-1, startY );
        } else if( lines.length === 2 ) {
            let nextLine = lines[1];
            let x2 = Math.round( nextLine[0] * multWidth );
            let y2 = Math.round( nextLine[1] * multHeight );
            context.lineTo( x2, y2 );
        }

        for( var i = 1; i < lines.length - 2; i++ ) {
            let nextLine = lines[i + 1];
            let x1 = Math.round( lines[i][0] * multWidth );
            let y1 = Math.round( lines[i][1] * multHeight );
            let x2 = Math.round( nextLine[0] * multWidth );
            let y2 = Math.round( nextLine[1] * multHeight );

            let xc = (x1 + x2) / 2;
            let yc = (y1 + y2) / 2;

            context.quadraticCurveTo(x1, y1, xc, yc);
        }

        if( lines.length > 2 ) {
            let lastLine = lines[i + 1];
            let x1 = Math.round( lines[i][0] * multWidth );
            let y1 = Math.round( lines[i][1] * multHeight );
            let x2 = Math.round( lastLine[0] * multWidth );
            let y2 = Math.round( lastLine[1] * multHeight );

            context.quadraticCurveTo(x1, y1, x2, y2);
        }
        
        context.stroke();
    }
    
    @action mouseDraw = ( e, newMove ) => {
        const { roomStore, canvasStore } = this.props.rootStore;
        this.moveCursor( e, true );
        if( roomStore.currentDrawer && this.mouseDrawing ) {
            //If mouse was outside, start new line
            if( this.mouseOutside ) { 
                newMove = true;
                this.previewedLines = false;
                this.previewTime = null;
            }

            let lines = [ this.getLineFromEvent( e, !newMove ) ];
            if( lines.length === 0 || lines[0] === null ) return;

            //Skip points that are too close to the previous one
            if( this.pendingLines.lines.length > 0 ) {
                let lastLine = this.pendingLines.lines[ this.pendingLines.lines.length - 1 ];
                let x1 = lines[0][0];
                let y1 = lines[0][1];
                let x2 = lastLine[0];
                let y2 = lastLine[1];
                let dist = Math.sqrt( Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1, 2 ) );
                if( dist <= 1 ) {
                    return;
                }
            }

            //Start new line in undo history
            if( newMove && !this.mouseOutside ) {
                this.undoHistory.push( 0 );
            }

            //If mouse was outside, use last point of mouse outside the canvas as start of line
            if( this.mouseOutside ) {
                if( this.lastMouseOutside !== null ) {
                    lines.unshift( this.lastMouseOutside );
                }
                this.mouseOutside = false;
            }

            //Only track colour/thick on new line
            if( newMove ) {
                let thick = canvasStore.brushSize;
                if( canvasStore.eraserEnabled ) {
                    thick += ERASER_EXTRA;
                }
                this.pendingLines.colour = canvasStore.cursorColour;
                this.pendingLines.thick = thick;
            }

            //Push points to array to draw client-side and array to send to server
            for( let i = 0; i < lines.length; i++ ) {
                this.pendingLines.lines.push( lines[i] );
                this.pendingPreview.push( lines[i] );
            }

            let now = Date.now();

            //Display line client-side after 3 points saved
            if( this.pendingPreview.length >= 3 ) {
                //Draw line
                this.previewPendingLines();
                this.previewedLines = true;

                //Send to server after buffering time
                if( ( now - this.lastSendPending ) >= 1000 ) {
                    this.sendPendingLines();
                    this.lastSendPending = now;
                }
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

    @action onMouseUpOutside = ( e ) => {
        const { canvasStore } = this.props.rootStore;

        if( this.mouseDrawing && this.mouseOutside ) {
            this.mouseDrawing = false;
            this.mouseOutside = false;
            canvasStore.mouseDown = false;
        }
    }

    //Track mouse outside canvas if player still drawing
    mouseMoveOutside = ( e ) => {
        if( this.mouseDrawing && this.mouseOutside ) {
            let line = this.getLineFromEvent( e, false );
            if( line === null ) {
                this.lastMouseOutside = null;
            } else {
                this.lastMouseOutside = line;
            }
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

   
    isTouching = false;
    //mousedown & touchstart
    @action onMouseTouchStart = ( e ) => {
        e.preventDefault();
        initSounds();
        const { roomStore, canvasStore } = this.props.rootStore;
        if ( roomStore.currentDrawer ) {
            //Prevent mousedown firing after a quick touch tap (weird bug)
            if( e.nativeEvent.type === 'touchstart' ) {
                this.isTouching = true;
            } else if( this.isTouching ) {
                return;
            }
            this.lastSendPending = Date.now();
            this.mouseOutside = false;
            this.mouseDrawing = true;
            canvasStore.mouseDown = true;
            this.mouseDraw( e, true );
        }
    }

    onMouseOut = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        this.mouseDraw( e, false );
        this.mouseOutside = true;
        canvasStore.hideCursor();

        this.previewPendingLines();
        this.previewedLines = false;
        this.sendPendingLines();
        this.previewTime = null;
    }

    @action onMouseUp = ( e ) => {
        const { canvasStore } = this.props.rootStore;

        this.mouseDrawing = false;
        canvasStore.mouseDown = false;
        this.mouseOutside = false;
        this.lastMouseOutside = null;

        this.previewPendingLines();
        this.sendPendingLines();
        this.previewedLines = false;
        this.previewTime = null;
    }

    @action onTouchEnd = ( e ) => {
        const { canvasStore } = this.props.rootStore;
        this.mouseDrawing = false;
        canvasStore.mouseDown = false;
        canvasStore.hideCursor();
        this.mouseOutside = false;
        this.lastMouseOutside = null;

        this.previewPendingLines();
        this.sendPendingLines();
        this.previewedLines = false;
        this.previewTime = null;

        //Reset after preventing bug so users can switch between mouse & touch
        setTimeout( () => this.isTouching = false, 0 );
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