import { Injectable, Renderer2 } from '@angular/core';

import { interval, Observable, Subject } from 'rxjs';
import { throttle } from 'rxjs/operators';

import * as BezierEasing from 'bezier-easing';

// import { environment } from '@environment';
const DELAY_TIMER: number = 50;

@Injectable({
    providedIn: 'root',
})
export class ScrollService {
    public posY: number = 0;
    private _subject: Subject<number>;
    public observable: Observable<number>;

    private _onscroll: (event: Event) => void;
    private _detachListeners?: () => void;

    private bezierEasing: BezierEasing.EasingFunction;

    public lockedScroll: boolean = false;

    private renderer?: Renderer2;

    constructor() {
        this.posY = this.getScrollPosition();

        this._subject = new Subject<number>();

        // Throttle scroll change (first emit is instant, but the trailing emits are delayed by DELAY_TIMER)
        this.observable = this._subject.pipe(throttle(value => {
            return interval(DELAY_TIMER);
        }, {
            leading: true, trailing: true,
        }));

        this._onscroll = () => {
            this._getOnscroll();
        }

        this.bezierEasing = BezierEasing(0.25, 0.8, 0.25, 1);
    }

    private _getOnscroll(): void {
        this.posY = this.getScrollPosition();
        this._subject.next(this.posY);
    }

    public checkScroll(): void {
        this._getOnscroll();
    }

    private getScrollPosition(): number {
        return window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    public scrollTo(posY: number): void {
        return this._scrollTo(posY);
    }

    private _scrollTo(newY: number, oldY?: number, ms: number = 0, maxMS: number = 400): void {
        const _oldY = oldY || this.getScrollPosition();

        const frame = 1000 / 60; // ~16.67 ms

        let _ms = ms + frame;

        if (_ms >= maxMS) {
            window.scrollTo(0, newY);
            return;
        }

        let deltaY = newY - _oldY;

        const animationY = this.bezierEasing(_ms / maxMS) * deltaY;

        const posY = _oldY + animationY;

        window.scrollTo(0, posY);

        setTimeout(() => {
            this._scrollTo(newY, oldY, _ms, maxMS);
        }, frame);
    }

    public init(renderer: Renderer2): void {
        this.detach();
        this.renderer = renderer;

        const _off__scroll = renderer.listen('window', 'scroll', this._onscroll);
        const _off__resize = renderer.listen('window', 'resize', this._onscroll);
        const _off__orientationchange = renderer.listen('window', 'orientationchange', this._onscroll);

        this._detachListeners = () => {
            _off__scroll();
            _off__resize();
            _off__orientationchange();
        };
    }

    public detach(): void {
        this._detachListeners && this._detachListeners();
    }

    public lockScroll(): void {
        if (this.lockedScroll) {
            return;
        }

        this.lockedScroll = true;

        if (!this.renderer) {
            debugger;
            throw new Error("Unexpected missing renderer");
        }

        const offsetY = window.pageYOffset;
        this.renderer.addClass(document.body, 'js-lock-position');
        this.renderer.setStyle(document.body, 'top', `${-offsetY}px`);
    }

    public unlockScroll(): void {
        if (!this.lockedScroll) {
            return;
        }

        this.lockedScroll = false;

        
        if (!this.renderer) {
            debugger;
            throw new Error("Unexpected missing renderer");
        }

        const offsetY = Math.abs(parseInt(document.body.style.top || "0", 10));
        this.renderer.removeClass(document.body, 'js-lock-position');
        this.renderer.setStyle(document.body, 'top', `${-offsetY}px`);
        this.renderer.removeStyle(document.body, 'top');
        window.scrollTo(0, offsetY || 0);
    }
}
