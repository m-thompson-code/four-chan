import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LoaderService {
    public loaderCount: number = 0;

    constructor() {

    }

    public inc(): void {
        this.loaderCount += 1;
    }
    
    public dec(): void {
        this.loaderCount -= 1;

        if (this.loaderCount < 0) {
            this.loaderCount = 0;
        }
    }
}
