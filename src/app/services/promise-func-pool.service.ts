import { Injectable } from '@angular/core';

export type PromiseFunc<T> = () => Promise<T>;

@Injectable({
    providedIn: 'root',
})
export class PromiseFuncPoolService {

    constructor() {

    }

    public pool<T>(pFuncs: PromiseFunc<T>[], poolSize: number=1): Promise<void> {
        if (!pFuncs || !pFuncs.length) {
            return Promise.resolve();
        }

        let _poolSize = poolSize;
    
        if (_poolSize <= 1) {
            _poolSize = 1;
        }
    
        const promises = [];
    
        for (let i = 0; i < _poolSize; i++) {
            promises.push(this._loop(pFuncs));
        }
    
        return Promise.all(promises).then(() => {
            // Promise func pool has settled
        });
    };
    
    private _loop<T>(pFuncs: PromiseFunc<T>[]): Promise<void> {
        const pFunc = pFuncs.shift();

        if (!pFunc) {
            throw new Error("Unexpected pFunc not defined");
        }
    
        return pFunc().then(() => {
            if (pFuncs.length) {
                return this._loop(pFuncs);
            }

            return;
        });
    };
}
