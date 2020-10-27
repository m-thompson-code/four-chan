import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostComponent } from './post.component';

import { DirectivesModule } from '@app/directives';

import { IconButtonModule } from '@app/components/icon-button';

@NgModule({
    declarations: [PostComponent],
    imports: [
        CommonModule,

        DirectivesModule,

        IconButtonModule,
        
    ],
    exports: [PostComponent]
})
export class PostModule { }
