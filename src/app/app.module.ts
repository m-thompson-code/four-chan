import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ButtonModule } from '@app/components/button';
import { ThreadModule } from '@app/components/thread';

import { DirectivesModule } from '@app/directives';

import { ServicesModule } from '@app/services';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        AppRoutingModule,

        ButtonModule,
        ThreadModule,

        DirectivesModule,

        ServicesModule,
    ],
    providers: [],
    bootstrap: [AppComponent]
})
export class AppModule { }
