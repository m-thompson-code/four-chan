import { Directive, ElementRef, HostListener, AfterViewInit, Input, OnInit, ChangeDetectorRef } from '@angular/core';

@Directive({
    selector: '[mooMatchHeightDirective]',
})
export class MatchHeightDirective implements OnInit, AfterViewInit {
    private _matchHeightElement: HTMLElement | undefined;
    @Input()
    public set matchHeightElement(matchHeightElement: HTMLElement | undefined) {
        this._matchHeightElement = matchHeightElement;

        if (this.element.nativeElement) {
            this._recalcKeepRatio();
        }
    };

    public get matchHeightElement(): HTMLElement | undefined {
        return this._matchHeightElement;
    };

    private _debounceTimeout?: number;

    private _initalized: boolean;

    constructor(private element: ElementRef, private changeDetectorRef: ChangeDetectorRef) {
        this._initalized = false;
    }

    @HostListener('window:resize') public onResize(): void {
        this._debouncedMaintainHeight();
    }
    
    @HostListener('window:orientationchange') public onOrientationChange(): void {
        this._debouncedMaintainHeight();
    }

    public ngOnInit(): void {
        this._maintainHeight();
        this.changeDetectorRef.detectChanges();
    }

    public ngAfterViewInit(): void {
        this._maintainHeight();
        this.changeDetectorRef.detectChanges();

        // Safari/desktop doesn't handle this well on AfterViewInit, so we'll debouncing it and trying again
        // Safari issue on delivery/product: bottle and design will likely have the wrong width (fixes when you resize window)
        // IE 11 also doesn't maintain its ratio just right either, increasing debounce to 300ms
        window.setTimeout(() => {
            this._maintainHeight();
        }, 300);

        this._initalized = true;
    }

    // Maintains ratio based on height
    private _maintainHeight(): void {
        if (!this.matchHeightElement) {
            return;
        }

        const height = this.matchHeightElement.offsetHeight || this.matchHeightElement.getBoundingClientRect()?.height || 0;
       
        this.element.nativeElement.style.height = `${height}px`;
    }

    // @debounce(100)
    // @debounce decorator is only allowing the latest call to _debouncedMaintainHeight of any instance of this Class
    // This isn't ideal since there may be multiple elements using the KeepRatioDirective at the same time
    // To work around this, we are handing the debounce on our own
    private _debouncedMaintainHeight(): void {
        clearTimeout(this._debounceTimeout);
        this._debounceTimeout = window.setTimeout(() => {
            this._maintainHeight();
        }, 100);
    }

    private _recalcKeepRatio(): void {
        if (!this._initalized) {
            return;
        }
        
        clearTimeout(this._debounceTimeout);
        this._debounceTimeout = window.setTimeout(() => {
            this._maintainHeight();
        }, 0);

        // Safari/desktop doesn't handle this well on AfterViewInit, so we'll debouncing it and trying again
        // Safari issue on delivery/product: bottle and design will likely have the wrong width (fixes when you resize window)
        // IE 11 also doesn't maintain its ratio just right either, increasing debounce to 300ms
        window.setTimeout(() => {
            this._maintainHeight();
        }, 300);
    }
}
