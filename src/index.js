import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'mobx-react';
import RootStore from 'RootStore';
import App from 'App';
import registerServiceWorker from './registerServiceWorker';
import 'normalize.css';
import './styles/fa-drawasaurus.css';

import Raven from 'raven-js';
Raven.config('https://1f25cfbe6e1043adb70d91db713327fe@sentry.io/305501').install();

const rootElement = document.getElementById('root');

if( rootElement.hasChildNodes() ) {
  ReactDOM.hydrate( (
    <BrowserRouter>
      <Provider rootStore={new RootStore()}>
        <App />
      </Provider>
    </BrowserRouter>
  ), rootElement );
} else {
  ReactDOM.render( (
    <BrowserRouter>
      <Provider rootStore={new RootStore()}>
        <App />
      </Provider>
    </BrowserRouter>
  ), rootElement );
}
registerServiceWorker();