import { Component, OnInit, Input } from '@angular/core';
import { Post } from '@app/services/data.service';

@Component({
    selector: 'moo-post',
    templateUrl: './post.template.html',
    styleUrls: ['./post.style.scss']
})
export class PostComponent implements OnInit {
    @Input() post!: Post;
    private _getDimensionsInterval?: number;
    public dimensionsLoaded: boolean = true;

    constructor() {
    }

    public ngOnInit(): void {
        if (!this.post) {
            debugger;
        }
    }
    
    public toggleImage(post: Post, div?: HTMLDivElement): void {
        if (post.spoiler) {
            post.spoiler = false;
            return;
        }

        if (post.ext === '.webm') {
            this.dimensionsLoaded = true;
        }

        // Disable minimizing so we can interact with the video controls
        if (post.expanded && post.ext === '.webm') {
            return;
        }

        post.expanded = !post.expanded;

        // if (post.expanded) {
        //     this.getImageDimensions();
        // }

        if (div) {
            const _rBox = div.getBoundingClientRect();

            // Element vertical position relative to current scroll position on document
            const relativeY = _rBox.top;

            if (relativeY < 0) {
                div.scrollIntoView();
            }
        }

        // setTimeout(() => {
        //     // debugger;
        // }, 50);
    }

    // public getImageDimensions(): Promise<void> {
    //     const src = this.post.imageUrl;

    //     if (!src) {
    //         this.dimensionsLoaded = true;
    //         return Promise.resolve();
    //     }

    //     const image = new Image();

    //     return new Promise(resolve => {
    //         const _l = () => {
    //             this.dimensionsLoaded = true;
    //             resolve();

    //             setTimeout(() => {
    //                 // debugger;
    //             }, 1);
                
    //             clearInterval(this._getDimensionsInterval);
    //         };

    //         if (!src) {
    //             this.dimensionsLoaded = true;
    //             _l();
    //         }

    //         image.onload = () => {
    //             console.log("onload");
    //             _l;
    //         };
    //         image.onerror = () => {
    //             console.log("onerror");

    //             _l;
    //         };

    //         clearInterval(this._getDimensionsInterval);

    //         this._getDimensionsInterval = window.setInterval(() => {
    //             if (image.naturalWidth && image.naturalHeight) {
    //                 console.log("naturalWidth detected");
    //                 _l();
    //             }
    //         }, 50);

    //         image.src = src;
    //     });
    // }

    public ngOnDestroy(): void {
        clearInterval(this._getDimensionsInterval);
    }
}
