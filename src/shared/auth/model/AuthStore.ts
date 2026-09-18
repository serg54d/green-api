import {makeAutoObservable, observable, runInAction} from 'mobx';
import {authApi} from '@/shared/api/green-api/authApi';
import {getConnectionErrorMessage, getInstanceStateMessage} from '@/shared/api/green-api/errors';
import type {Credentials} from '@/shared/api/green-api/types';

export class AuthStore {
  status: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  credentials: Credentials | null = null;
  error: string | null = null;
  instanceState: string | null = null;
  private controller: AbortController | null = null;

  constructor() {
    makeAutoObservable<this, 'controller'>(this, {
      controller: false,
      credentials: observable.ref,
    });
  }

  get isAuthorized() {
    return this.status === 'connected';
  }

  // Проверяет доступ по ID/токену и готовность инстанса
  async connect(values: Credentials): Promise<boolean> {
    if (this.status === 'connecting') return false;
    const credentials = {...values};
    const controller = new AbortController();
    this.controller = controller;
    this.credentials = null;
    this.error = null;
    this.instanceState = null;
    this.status = 'connecting';

    try {
      const result = await authApi.getStateInstance(credentials, controller.signal);
      if (this.controller !== controller || controller.signal.aborted) return false;

      runInAction(() => {
        this.instanceState = result.stateInstance;
        if (result.stateInstance === 'authorized') {
          this.credentials = credentials;
          this.status = 'connected';
        } else {
          this.status = 'disconnected';
          this.error = getInstanceStateMessage(result.stateInstance);
        }
      });
      return this.isAuthorized;
    } catch (error) {
      if (this.controller !== controller || controller.signal.aborted) return false;
      runInAction(() => {
        this.status = 'disconnected';
        this.error = getConnectionErrorMessage(error);
      });
      return false;
    } finally {
      if (this.controller === controller) this.controller = null;
    }
  }

  logout() {
    this.controller?.abort();
    this.controller = null;
    this.credentials = null;
    this.error = null;
    this.instanceState = null;
    this.status = 'disconnected';
  }
}
