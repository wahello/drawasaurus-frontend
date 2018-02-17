import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'mobx-react';
import RootStore from 'RootStore';
import App from 'App';
import registerServiceWorker from './registerServiceWorker';
import 'normalize.css';
import './styles/fa-drawasaurus.css';

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