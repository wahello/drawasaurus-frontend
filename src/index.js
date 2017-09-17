import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'mobx-react';
import RootStore from 'RootStore';
import App from 'App';
import 'normalize.css';
import './styles/fa-drawasaurus.css';

ReactDOM.render( (
  <BrowserRouter>
    <Provider rootStore={new RootStore()}>
      <App />
    </Provider>
  </BrowserRouter>
), document.getElementById( 'root' ) );
