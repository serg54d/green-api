import {makeAutoObservable} from 'mobx';

export class AuthStore {
    isAuthorized = false;

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