import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostComponent } from './post.component';

import { DirectivesModule } from '@app/directives';

@NgModule({
    declarations: [PostComponent],
    imports: [
        CommonModule,

        DirectivesModule,
    ],
    exports: [PostComponent]
})
export class PostModule { }
