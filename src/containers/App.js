import React, { Component } from 'react';
import { Switch, Route } from 'react-router-dom';
import { observer, Provider, inject } from 'mobx-react';
import { action } from 'mobx';
// import DevTools from 'mobx-react-devtools';
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import Header from 'Header';
import Footer from 'Footer';
import Lobby from 'Lobby';
import Room from 'Room';
import Error404 from 'Error404';
import Modal from 'Modal';
import LoginWindow from 'modals/LoginWindow';
import 'styles/App.scss';

let connection = 'https://' + window.location.hostname;
if( window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ) {
  connection += ':8000';
}
const socket = io( connection, { transports: ['websocket'], upgrade: false, secure: true } );

@inject('rootStore') @observer
class App extends Component {
  componentWillMount() {
    const { uiStore } = this.props.rootStore;
    socket.on( 'connect', this.onConnect );
    socket.on( 'disconnect', this.onDisconnect );
    
    socket.on( 'existingUsername', this.setUsername );
    socket.on('requestUsername', () => uiStore.showModal( <LoginWindow /> ) );
    socket.on( 'setUsername', this.setUsername );

    socket.on( 'setSession', ( id ) => {
        Cookies.set( 'session', id, { secure: true } );
    });
  }
  
  @action onConnect = () => {
    const { uiStore } = this.props.rootStore;
    uiStore.connecting = false;
  }

  @action onDisconnect = () => {
    const { uiStore } = this.props.rootStore;
    uiStore.connecting = true;
  }

  @action setUsername = ( username, forcedBecauseDuplicate, requested ) => {
    const { uiStore } = this.props.rootStore;

    if( forcedBecauseDuplicate ) {
      if( typeof requested === 'string' ) {
        Cookies.set( 'username', requested, { expires: 365, secure: true } );
      }
    } else {
      Cookies.set( 'username', username, { expires: 365, secure: true } );
    }

    uiStore.currentUsername = username;
  }

  render() {
    const { roomStore } = this.props.rootStore;
    return (
      <Provider socket={socket}>
        <div className="c-app u-flex-columns">
          <Modal />
          {!roomStore.keyboardOpen &&
            <Header />
          }
          <Switch>
            <Route exact path='/' component={Lobby} />
            <Route path='/room/:name' component={Room} />
            <Route path='*' component={Error404} />
          </Switch>
          {!roomStore.keyboardOpen &&
            <Footer />
          }
          {/* <DevTools /> */}
        </div>
      </Provider>
    )
  }
}

export default App;
