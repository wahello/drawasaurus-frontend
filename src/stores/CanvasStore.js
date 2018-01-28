import { observable, action, computed } from 'mobx';

export const BASE_CANVAS_WIDTH = 800;
export const BASE_CANVAS_HEIGHT = 680;

export const ERASER_EXTRA = 5;
const CURSOR_EXTRA = 5;

class CanvasStore {
    @observable brushColour = '#000';
    @observable brushSize = 6;
    @observable canvasHeight = BASE_CANVAS_HEIGHT;
    @observable canvasWidth = BASE_CANVAS_WIDTH;
    @observable cursorX = 0;
    @observable cursorY = 0;
    @observable cursorVisible = false;
    @observable eraserEnabled = false;
    @observable fillColour = '#fff';
    @observable headerHeight = 0;
    @observable landscape = false;
    @observable timerCentered = false;
    @observable timerSeconds = 90;
    @observable timerVisible = false;
    @observable updateCanvasBound = true;
    @observable undoValue = 0;
    @observable mouseDown = false;

    constructor( rootStore ) {
        this.rootStore = rootStore;
    }

    @action.bound reset() {
        this.brushColour = '#000';
        this.brushSize = 6;
        this.fillColour = '#fff';
        this.undoValue = 0;
        this.eraserEnabled = false;
    }

    @computed get multWidth() {
        return this.canvasWidth / BASE_CANVAS_WIDTH;
    }

    @computed get multWidthReverse() {
        return BASE_CANVAS_WIDTH / this.canvasWidth;
    }

    @computed get multHeight() {
        return this.canvasHeight / BASE_CANVAS_HEIGHT;
    }

    @computed get multHeightReverse() {
        return BASE_CANVAS_HEIGHT / this.canvasHeight;
    }

    @computed get undoEnabled() {
        return this.undoValue > 0;
    }

    @computed get cursorSize() {
        return Math.round( ( this.brushSize * this.multWidth + CURSOR_EXTRA ) 
                + ( this.eraserEnabled ? ERASER_EXTRA : 0 ) );
    }

    @computed get cursorLeft() {
        return Math.round( this.cursorX - ( this.cursorSize/2 ) );
    }

    @computed get cursorTop() {
        return Math.round( this.cursorY - ( this.cursorSize/2 ) );
    }

    @computed get cursorBlack() {
        return this.cursorColour === '#000';
    }

    @computed get cursorColour() {
        return ( this.eraserEnabled ? this.fillColour : this.brushColour );
    }

    @action.bound toggleEraser() {
        this.eraserEnabled = !this.eraserEnabled;
    }

    @action.bound showCursor( x, y ) {
        this.cursorVisible = true;
        this.cursorX = x;
        this.cursorY = y;
    }

    @action.bound hideCursor() {
        this.cursorVisible = false;
    }
}

export default CanvasStore;