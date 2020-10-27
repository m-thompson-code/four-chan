import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { environment } from '@environment';

import { Post } from '@app/services/data.service';

@Component({
    selector: 'moo-post',
    templateUrl: './post.template.html',
    styleUrls: ['./post.style.scss']
})
export class PostComponent implements OnInit {
    @Input() post!: Post;
    @Input() closeable: boolean = false;
    @Output() closeSelected: EventEmitter<void> = new EventEmitter();

    constructor() {
    }

    public ngOnInit(): void {
        if (!this.post && !environment.production) {
            debugger;
        }
    }
    
    public toggleImage(post: Post, div?: HTMLDivElement): void {
        if (post.spoiler) {
            post.spoiler = false;
            return;
        }

        // Disable minimizing so we can interact with the video controls
        if (post.expanded && post.ext === '.webm') {
            return;
        }

        post.expanded = !post.expanded;

        if (div) {
            const _rBox = div.getBoundingClientRect();

            // Element vertical position relative to current scroll position on document
            const relativeY = _rBox.top;

            if (relativeY < 0) {
                // window.scrollTo(0, relativeY);
                div.scrollIntoView();
            }
        }
    }
}
