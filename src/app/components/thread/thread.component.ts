import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { environment } from '@environment';

import { Visibility } from '@app/directives/scroll-listener.directive';

import { Post, Thread } from '@app/services/data.service';
import { ResponsiveService } from '@app/services/responsive.service';

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

    public canShowButtons: boolean = false;
    
    constructor(private responsiveService: ResponsiveService) {
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

    public scrollToBottomOfThread(): void {
        if (this._threadDiv) {
            const posY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

            const windowHeight = window.innerHeight;

            const e = this._threadDiv.nativeElement;

            const _rBox = e.getBoundingClientRect();

            // Height of element
            const height = e.offsetHeight || _rBox.height || 0;

            // Element vertical position relative to current scroll position on document
            const relativeY = _rBox.top;

            // Starting position of element on document
            const _rY = relativeY + posY;

            // Ending position of element on document
            const _rY2 = _rY + height;

            window.scrollTo(0, _rY2 - windowHeight);
        }
    }

    public updateVisibility(visiblity: Visibility): void {
        this.canShowButtons = false;

        this.thread.visibility = visiblity;

        if (!this.showButtons) {
            return;
        }

        const deviceType = this.responsiveService.responsiveMetadata.deviceType;

        if (deviceType === 'desktop' || deviceType === 'desktop_4k') {
            this.showButtons = true;
        } else {
            const height = this._threadDiv.nativeElement.offsetHeight;
            const windowHeight = window.innerHeight;
            
            if (height > windowHeight * 1.5) {
                this.canShowButtons = true;
            } else {
                this.canShowButtons = false;
            }
        }
    }
}
