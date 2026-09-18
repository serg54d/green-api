import {makeAutoObservable} from 'mobx';

export class AuthStore {
    isAuthorized = true;

    constructor() {
        makeAutoObservable(this);
    }

    login() {
        this.isAuthorized = true;
    }

    logout() {
        this.isAuthorized = false;
    }
}