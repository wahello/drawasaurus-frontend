import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import 'styles/Modal.scss';

@inject('rootStore') @observer
class Modal extends Component {
  render() {
    const { uiStore } = this.props.rootStore;
    return (
      <div className={"c-modal u-flex-center-all" + (uiStore.modal.visible ? '' : ' c-modal--hidden')}>
        {uiStore.modal.element}
      </div>
    );
  }
}

export default Modal;