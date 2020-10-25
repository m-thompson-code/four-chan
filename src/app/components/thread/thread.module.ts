import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThreadComponent } from './thread.component';

import { PostModule } from '@app/components/post';

import { DirectivesModule } from '@app/directives';

@NgModule({
    declarations: [ThreadComponent],
    imports: [
        CommonModule,

        DirectivesModule,

        PostModule,
    ],
    exports: [ThreadComponent]
})
export class ThreadModule { }
