import mobileDetect from 'mobile-detect';
export const IS_SSR = window.navigator.userAgent.includes( 'ReactSnap' );
export const IS_CRAWLER = new mobileDetect( window.navigator.userAgent ).is( 'Bot' );
export const USING_MOBILE = new mobileDetect( window.navigator.userAgent ).mobile();
export const USING_IOS = !isNaN( new mobileDetect( window.navigator.userAgent ).version('iOS') );