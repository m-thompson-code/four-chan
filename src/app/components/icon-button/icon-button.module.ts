import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IconButtonComponent } from './icon-button.component';

import { DirectivesModule } from '@app/directives';

@NgModule({
    declarations: [IconButtonComponent],
    imports: [
        CommonModule,

        DirectivesModule,
    ],
    exports: [IconButtonComponent]
})
export class IconButtonModule { }
