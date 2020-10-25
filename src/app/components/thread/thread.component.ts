import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { Visibility } from '@app/directives/scroll-listener.directive';
import { Thread } from '@app/services/data.service';

@Component({
    selector: 'moo-thread',
    templateUrl: './thread.template.html',
    styleUrls: ['./thread.style.scss']
})
export class ThreadComponent implements OnInit {
    @Input() thread!: Thread;

    public JSON: JSON;
    
    constructor() {
        this.JSON = JSON;
    }

    public ngOnInit(): void {
        if (!this.thread) {
            debugger;
        }
    }

    public updateVisibilityLogic(visiblity: Visibility): void {
        this.thread.visibility = visiblity;
    }
}
