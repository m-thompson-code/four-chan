import { Injectable, Renderer2 } from '@angular/core';
import { interval, Observable, Subject } from 'rxjs';
import { throttle } from 'rxjs/operators';

const DELAY_TIMER: number = 50;

export interface ResponsiveMetadata {
    deviceType: 'desktop_4k' | 'desktop' | 'tablet' | 'mobile';
    orientation: 'landscape' | 'portrait';
}

@Injectable({
    providedIn: 'root',
})
export class ResponsiveService {
    // This is managed on AppComponent
    public responsiveMetadata: ResponsiveMetadata;
    private _subject: Subject<ResponsiveMetadata>;
    public observable: Observable<ResponsiveMetadata>;

    private _onresize: (event: Event) => void;
    private _detachListeners?: () => void;

    constructor() {
        this.responsiveMetadata = this._getResponsiveMetadata();

        this._subject = new Subject<ResponsiveMetadata>();

        // Throttle scroll change (first emit is instant, but the trailing emits are delayed by DELAY_TIMER)
        this.observable = this._subject.pipe(throttle(value => {
            return interval(DELAY_TIMER);
        }, {
            leading: true, trailing: true,
        }));

        this._onresize = () => {
            this._getOnresize();
        }
    }

    private _getOnresize(): void {
        // console.log("_getOnresize");
        this.responsiveMetadata = this._getResponsiveMetadata();
        this._subject.next(this.responsiveMetadata);
    }

    public init(renderer2: Renderer2): void {
        this.detach();

        const _off__resize = renderer2.listen('window', 'resize', this._onresize);
        const _off__orientationchange = renderer2.listen('window', 'orientationchange', this._onresize);

        this._detachListeners = () => {
            _off__resize();
            _off__orientationchange();
        };
    }

    public detach(): void {
        this._detachListeners && this._detachListeners();
    }

    private _getResponsiveMetadata(): ResponsiveMetadata {
        const desktop_width = '1920px';
        const tablet_width = '1100px';
        const mobile_width = '600px';
        const landscape_width = '1400px';

        const tablet_height = '1100px';
        const mobile_height = '500px';

        const isLandscape = window.matchMedia(`(orientation: landscape)`).matches && window.matchMedia(`(max-width: ${landscape_width})`).matches;

        const isMobileLandscape = isLandscape && window.matchMedia(`(max-height: ${mobile_height})`);

        if (isMobileLandscape) {
            return {
                deviceType: 'mobile',
                orientation: 'landscape',
            };
        }

        const isTabletLandscape = isLandscape && window.matchMedia(`(max-height: ${tablet_height})`);

        if (isTabletLandscape) {
            return {
                deviceType: 'tablet',
                orientation: 'landscape',
            };
        }

        const isPortrait = window.matchMedia(`(orientation: portrait)`).matches;

        const isMobilePortrait = isPortrait && window.matchMedia(`(max-width: ${mobile_width})`);

        if (isMobilePortrait) {
            return {
                deviceType: 'mobile',
                orientation: 'portrait',
            };
        }
        
        const isTabletPortrait = isPortrait && window.matchMedia(`(max-width: ${tablet_width})`);

        if (isTabletPortrait) {
            return {
                deviceType: 'tablet',
                orientation: 'portrait',
            };
        }

        const isDesktop = window.matchMedia(`(max-width: ${desktop_width})`);

        if (isDesktop) {
            return {
                deviceType: 'desktop',
                orientation: 'landscape',
            };
        }

        return {
            deviceType: 'desktop_4k',
            orientation: 'landscape',
        };
    }
}
