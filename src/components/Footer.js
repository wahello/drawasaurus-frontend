import React, { Component } from 'react';
import { inject } from 'mobx-react';
import { action } from 'mobx';
import { USING_IOS, IS_SSR } from 'api/UserAgent';

@inject('rootStore')
class Footer extends Component {
    constructor( props ) {
        super( props );
        this.state = { adblocked: null };
    }

    @action componentDidMount() {
        const { roomStore } = this.props.rootStore;
        window.addEventListener( 'resize', this.resize );
        window.addEventListener( 'load', this.loadAds );

        if( USING_IOS && !roomStore.keyboardOpen ) {
            roomStore.forceRefresh = true;
        }
    }

    componentWillUnmount() {
        window.removeEventListener( 'resize', this.resize );
        window.removeEventListener( 'load', this.loadAds );
    }

    @action loadAds = () => {
        if( IS_SSR ) return;
        const { roomStore } = this.props.rootStore;
        try {
            ( window.adsbygoogle = window.adsbygoogle || [] ).push( {} );
            roomStore.forceRefresh = true;
            setTimeout( this.checkAdblock, 500 );
        } catch( err ) {
            this.setState( { adblocked: true } );
        }
    }

    @action checkAdblock = () => {
        if( this.ad === null ) return;
        const { roomStore } = this.props.rootStore;

        if( this.ad.clientHeight === 0 ) {
            this.setState( { adblocked: true } );
            roomStore.forceRefresh = true;
        } else {
            this.setState( { adblocked: false } );
        }
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

    render() {
        return (
            <footer className="c-footer">
                { this.state.adblocked && 
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