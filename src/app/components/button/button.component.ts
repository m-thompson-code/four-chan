import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'moo-button',
    templateUrl: './button.template.html',
    styleUrls: ['./button.style.scss']
})
export class ButtonComponent {
    // @Input() public text: string = '';
    @Input() public hasBackground: boolean = false;
    
    constructor() {
    }
}
