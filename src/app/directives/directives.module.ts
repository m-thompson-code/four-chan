import { NgModule } from '@angular/core';

import { KeepRatioDirective } from './keep-ratio.directive';
import { MatchHeightDirective } from './match-height.directive';
import { ScrollListenerDirective } from './scroll-listener.directive';

@NgModule({
    imports: [],
    declarations: [
        KeepRatioDirective,
        MatchHeightDirective,
        ScrollListenerDirective,
    ],
    exports: [
        KeepRatioDirective,
        MatchHeightDirective,
        ScrollListenerDirective,
    ],
})

export class DirectivesModule {
}
