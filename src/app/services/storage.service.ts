import { Injectable } from '@angular/core';

//https://www.reddit.com/r/javascript/comments/2z06aq/local_storage_is_not_supported_with_safari_in/

@Injectable()
export class StorageService {
    private _backupStorage: {
        [key: string]: string;
    };

    public storageType = "localStorage";
    public shouldUseLocalStorage: boolean;
    public shouldUseSessionStorage: boolean;

    constructor() {
        this._backupStorage = {};

        this.shouldUseLocalStorage = false;
        this.shouldUseSessionStorage = false;

        if (this._isLocalStorageIsWorking()) {
            this.shouldUseLocalStorage = true;
        } else if (this._isSessionStorageIsWorking()) {
            this.shouldUseLocalStorage = false;
            this.shouldUseSessionStorage = true;

            console.warn(" ~ LocalStorage doesn't seem to be working, falling back to SessionStorage");
        } else {
            this.shouldUseLocalStorage = false;
            this.shouldUseSessionStorage = false;

            console.error("~ SessionStorage doesn't seem to be working, falling back Application's StorageService's local backupStorage. Data persistance should not be expected.");
        }
    }

    private _isLocalStorageIsWorking(): boolean {
        if (window.localStorage) {
            try {
                window.localStorage.setItem("__storage__service__test", "1");
                window.localStorage.removeItem("__storage__service__test");

                return true;
            } catch(ex) {
                return false;
            }
        }

        return false;
    }

    private _isSessionStorageIsWorking(): boolean {
        if (window.sessionStorage) {
            try {
                window.sessionStorage.setItem("__storage__service__test", "2");
                window.sessionStorage.removeItem("__storage__service__test");

                return true;
            } catch(ex) {
                return false;
            }
        }

        return false;
    }

    public setItem(key: string, value: string): void {
        if (this.shouldUseLocalStorage) {
            localStorage.setItem(key, value);
        } else if (this.shouldUseSessionStorage) {
            sessionStorage.setItem(key, value);
        } else {
            this._backupStorage[key] = value;
        }
    }

    public getItem(key: string): string | null {
        if (this.shouldUseLocalStorage) {
            return localStorage.getItem(key);
        } else if (this.shouldUseSessionStorage) {
            return localStorage.getItem(key);
        }

        const _b = this._backupStorage[key];

        if (_b || _b === '') {
            return _b;
        }

        return null;
    }

    public removeItem(key: string): void {
        if (this.shouldUseLocalStorage) {
            localStorage.removeItem(key);
        } else if (this.shouldUseSessionStorage) {
            sessionStorage.removeItem(key);
        } else {
            // Typescript gets mad about setting this to undefined, but it's only temporary as it's best practice to set to undefined before using delete
            // @ts-ignore:2322
            this._backupStorage[key] = undefined;
            delete this._backupStorage[key];

            // source: https://stackoverflow.com/questions/208105/how-do-i-remove-a-property-from-a-javascript-object
            // source: http://perfectionkills.com/understanding-delete/
        }
    }

    /**
     * Clears all storages. LocalStorage, SessionStorage, _backgroundStorage
     * This method doesn't follow the testing for which service is available, could lead to errors
     */
    public clear(): void {
        if (window.localStorage) {
            try {
                window.localStorage.clear();
            } catch(ex) {
                console.error(ex);
            }
        }

        if (window.sessionStorage) {
            try {
                window.sessionStorage.clear();
            } catch(ex) {
                console.error(ex);
            }
        }

        this._backupStorage = {};
    }
}
