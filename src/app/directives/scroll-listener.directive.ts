import { Directive, ElementRef, Input, OnInit, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';

import { Subscription } from 'rxjs';

import { ScrollService } from '@app/services/scroll.service';

export interface Visibility {
    topRatio: number;
    bottomRatio: number;
    fixedTopRatio: number;
    fixedBottomRatio: number;
    visibile: boolean;
}

@Directive({
    selector: '[mooScrollListener]',
    exportAs:'customdirective'   //the name of the variable to access the directive
})
export class ScrollListenerDirective implements OnInit {
    private _scrollObserver?: Subscription;
    @Output() public visibilityChanged: EventEmitter<Visibility> = new EventEmitter();

    constructor(private element: ElementRef<HTMLElement>, private changeDetectorRef: ChangeDetectorRef, private scrollService: ScrollService) {
    }

    public ngOnInit(): void {
        this._handlePosY(this.scrollService.posY);
        this.changeDetectorRef.detectChanges();

        this._scrollObserver = this.scrollService.observable.subscribe(posY => {
            this._handlePosY(posY);
        });
    }

    public ngAfterViewInit(): void {
        this._handlePosY(this.scrollService.posY);
        this.changeDetectorRef.markForCheck();
    }

    private _handlePosY(posY: number): void {
        const windowHeight = window.innerHeight;

        if (!windowHeight) {
            return;
        }

        const e = this.element.nativeElement;

        const _rBox = e.getBoundingClientRect();

        // Height of element
        const height = e.offsetHeight || _rBox.height || 0;

        // Element vertical position relative to current scroll position on document
        const relativeY = _rBox.top;

        // Starting position of element on document
        const _rY = relativeY + posY;

        // Ending position of element on document
        const _rY2 = _rY + height;
            
        const topVisibilityRatio = 1 - (_rY - posY) / windowHeight;
        const bottomVisibilityRatio = (_rY2 - posY) / windowHeight;

        let fixedTopVisibilityRatio = topVisibilityRatio;
        let fixedBottomVisibilityRatio = bottomVisibilityRatio;

        if (fixedTopVisibilityRatio > 1) {
            fixedTopVisibilityRatio = 1;
        } else if (fixedTopVisibilityRatio < 0) {
            fixedTopVisibilityRatio = 0;
        }

        if (fixedBottomVisibilityRatio > 1) {
            fixedBottomVisibilityRatio = 1;
        } else if (fixedBottomVisibilityRatio < 0) {
            fixedBottomVisibilityRatio = 0;
        }

        let visible = true;

        if (topVisibilityRatio < 0 || bottomVisibilityRatio < 0) {
            visible = false;
        }

        this.visibilityChanged.emit({
            topRatio: topVisibilityRatio,
            bottomRatio: bottomVisibilityRatio,
            fixedTopRatio: fixedTopVisibilityRatio,
            fixedBottomRatio: fixedBottomVisibilityRatio,
            visibile: visible,
        });
    }

    public scrollToTop() {
        // console.log(this.element);

        const e = this.element.nativeElement;

        const _rBox = e.getBoundingClientRect();

        // Height of element
        const height = e.offsetHeight || _rBox.height || 0;

        // Element vertical position relative to current scroll position on document
        const relativeY = _rBox.top;

        // Starting position of element on document
        const _rY = relativeY + this.scrollService.posY;

        // Ending position of element on document
        const _rY2 = _rY + height;

        // window.scrollTo(0, _rY);
        this.scrollService.scrollTo(_rY);
    }

    public scrollToBottom() {
        const windowHeight = window.innerHeight;

        // console.log(this.element);

        const e = this.element.nativeElement;

        const _rBox = e.getBoundingClientRect();

        // Height of element
        const height = e.offsetHeight || _rBox.height || 0;

        // Element vertical position relative to current scroll position on document
        const relativeY = _rBox.top;

        // Starting position of element on document
        const _rY = relativeY + this.scrollService.posY;

        // Ending position of element on document
        const _rY2 = _rY + height;

        // window.scrollTo(0, _rY2 - windowHeight);
        this.scrollService.scrollTo(_rY2 - windowHeight);
    }

    public ngOnDestroy(): void {
        this._scrollObserver?.unsubscribe();
    }
}
