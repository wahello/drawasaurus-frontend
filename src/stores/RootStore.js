import { useStrict } from 'mobx';
import UIStore from 'UIStore';
import RoomStore from 'RoomStore';
import CanvasStore from 'CanvasStore';

useStrict( true );

class RootStore {
    constructor() {
        this.uiStore = new UIStore( this );
        this.canvasStore = new CanvasStore( this );
        this.roomStore = new RoomStore( this );
    }
}

export default RootStore;