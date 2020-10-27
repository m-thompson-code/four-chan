import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonComponent } from './button.component';

import { DirectivesModule } from '@app/directives';

@NgModule({
    declarations: [ButtonComponent],
    imports: [
        CommonModule,

        DirectivesModule,
    ],
    exports: [ButtonComponent]
})
export class ButtonModule { }
