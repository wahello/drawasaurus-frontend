import React, { Component } from 'react';
import classNames from 'classnames';
import 'styles/Toast.scss';

class Toast extends Component {
    constructor( props ) {
        super( props );
        this.state = {
            update: false
        };
    }

    componentDidMount() {
        document.addEventListener( 'drawasaurusupdate', this.showToast );
    }
    
    componentWillUnmount() {
        document.removeEventListener( 'drawasaurusupdate', this.showToast );
    }

    showToast = () => {
        this.setState( {
            update: true
        } );
    }

    render() {
        const classes = classNames( {
            'c-toast u-flex-center-all': true,
            'u-hidden': !this.state.update
        } );
        return (
            <div className={classes}>
                A new version of Drawasaurus is available!
                <a className="c-toast__refresh" href="">REFRESH</a>
            </div>
        );
    }
}

export default Toast;