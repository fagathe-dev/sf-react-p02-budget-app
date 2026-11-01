import { StorageService } from 'core-ts';

export const appStorage = new StorageService('local');
export const sessionAppStorage = new StorageService('session');