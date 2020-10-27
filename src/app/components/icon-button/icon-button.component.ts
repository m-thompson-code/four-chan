import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'moo-icon-button',
    templateUrl: './icon-button.template.html',
    styleUrls: ['./icon-button.style.scss']
})
export class IconButtonComponent {
    @Input() public icon: string = '';
    @Input() public hasBackground: boolean = false;
    
    constructor() {
    }
}
