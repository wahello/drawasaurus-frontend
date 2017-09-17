import React, { Component } from 'react';

class Footer extends Component {
    constructor( props ) {
        super( props );
        this.state = { adBlocked: false };
    }

    componentDidMount() {
        ( window.adsbygoogle = window.adsbygoogle || [] ).push( {} );
        window.addEventListener( 'resize', this.resize );
        setTimeout( this.adblock, 500 );
    }

    componentWillUnmount() {
        window.removeEventListener( 'resize', this.resize );
    }

    resize = () => {
        let width = this.ad.clientWidth;
        let adInner = this.ad.children[ 0 ];
        if( !adInner ) return;
        let adWidth = adInner.clientWidth;

        if( width < adWidth ) {
            adInner.style.left = ( ( width - adWidth ) / 2 ) + 'px';
        } else {
            adInner.style.left = '0px';
        }
    }

    adblock = () => {
        if( this.ad.clientHeight === 0 ) {
            this.setState( { adBlocked: true } );
        }
    }

    render() {
        return (
            <footer className="c-footer">
                { this.state.adBlocked && 
                    <div className="c-footer__blocked u-flex-center-all">
                    <span className="c-footer__blocktext">
                        Please consider disabling your ad blocker to help us continue running 
                        <i className="icon-heart" />
                    </span>
                    </div>
                }
                <ins className="adsbygoogle c-footer-ad"
                    ref={ad => this.ad = ad}
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-0119855853253942"
                    data-ad-slot="2237465594"
                    data-ad-format="horizontal">
                </ins>
            </footer>
        );
    }
}

export default Footer;