import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ThreadComponent } from './thread.component';

import { PostModule } from '@app/components/post';

import { DirectivesModule } from '@app/directives';

import { ButtonModule } from '@app/components/button';
import { IconButtonModule } from '@app/components/icon-button';

@NgModule({
    declarations: [ThreadComponent],
    imports: [
        CommonModule,

        DirectivesModule,

        ButtonModule,
        IconButtonModule,

        PostModule,
    ],
    exports: [ThreadComponent]
})
export class ThreadModule { }
