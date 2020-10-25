import { NgModule } from '@angular/core';

import { ScrollService } from './scroll.service';
import { ResponsiveService } from './responsive.service';
import { DataService } from './data.service';
import { StorageService } from './storage.service';
import { LoaderService } from './loader.service';

@NgModule({
    providers: [
        // FirebaseService,
        ScrollService,
        // NavigationDrawerService,
        ResponsiveService,
        DataService,
        StorageService,
        LoaderService,
    ],
})
export class ServicesModule {
}
