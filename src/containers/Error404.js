import React, { Component } from 'react';

class Error404 extends Component {
    render() {
        return (
            <div className="l-lobby u-flex-columns u-flex-center">
                <div className="c-lobby-header u-flex-columns u-flex-center-all">
                    <span className="c-lobby-header__404">Page not found!</span>
                    <span className="c-lobby-header__welcome">404 Not Found</span>
                </div>
            </div>
        );
    }
}

export default Error404;