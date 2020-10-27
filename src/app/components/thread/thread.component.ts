import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { environment } from '@environment';

import { Visibility } from '@app/directives/scroll-listener.directive';

import { Post, Thread } from '@app/services/data.service';

@Component({
    selector: 'moo-thread',
    templateUrl: './thread.template.html',
    styleUrls: ['./thread.style.scss']
})
export class ThreadComponent implements OnInit {
    @ViewChild('threadDiv') private _threadDiv!: ElementRef<HTMLDivElement>;

    @Input() public thread!: Thread;
    @Input() public highlight: boolean = false;
    @Input() public showButtons: boolean = false;

    @Output() closeSelected: EventEmitter<Post> = new EventEmitter();
    @Output() public deleteSelected: EventEmitter<void> = new EventEmitter();
    @Output() public snoozeSelected: EventEmitter<void> = new EventEmitter();
    @Output() public loadMoreSelected: EventEmitter<void> = new EventEmitter();

    public JSON: JSON;
    
    constructor() {
        this.JSON = JSON;
    }

    public ngOnInit(): void {
        if (!this.thread && !environment.production) {
            debugger;
        }
    }

    public scrollToTopOfThread(): void {
        if (this._threadDiv) {
            const posY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

            const _rBox = this._threadDiv.nativeElement.getBoundingClientRect();

            // Element vertical position relative to current scroll position on document
            const relativeY = _rBox.top;

            // Starting position of element on document
            const _rY = relativeY + posY;

            // Scroll to top of thread but make room for the buttons above and add padding (160px)
            window.scrollTo(0, _rY - 160);
        }
    }

    public updateVisibilityLogic(visiblity: Visibility): void {
        this.thread.visibility = visiblity;
    }
}
