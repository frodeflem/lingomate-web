import { atom } from "jotai";


// Retrieve a unique identifier for the current tab from sessionStorage
function getTabId() {
	if (typeof sessionStorage === 'undefined') {
		return 0;
	}
	
    let tabId = sessionStorage.getItem('tabId');
    if (!tabId) {
        tabId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('tabId', tabId);
    }
    return tabId;
};

export function getTabStorage(key: string) {
	if (typeof sessionStorage === 'undefined') {
		return undefined;
	}
	
	const tabId = getTabId();

	const sessionStorageValue = sessionStorage.getItem(`${tabId}_${key}`);
	if (sessionStorageValue) {
		return JSON.parse(sessionStorageValue);
	}

	const localStorageValue = localStorage.getItem(key);
	if (localStorageValue) {
		sessionStorage.setItem(`${tabId}_${key}`, localStorageValue);
		return JSON.parse(localStorageValue);
	}

	return undefined;
}

export function setTabStorage(key: string, value: any) {
	if (typeof sessionStorage === 'undefined') {
		return;
	}

	const tabId = getTabId();
	localStorage.setItem(key, JSON.stringify(value));
	sessionStorage.setItem(`${tabId}_${key}`, JSON.stringify(value));
}

export const tabSpecificStorage = {
    getItem: (key: string) => {
		if (typeof sessionStorage === 'undefined') {
			return undefined;
		}

        const tabId = getTabId();
        const sessionStorageValue = sessionStorage.getItem(`${tabId}_${key}`);
        if (sessionStorageValue) {
            return JSON.parse(sessionStorageValue);
        }
        // Fallback to localStorage if no tab-specific value is found
        let localStorageValue = localStorage.getItem(key);

		if (!localStorageValue) {
			return undefined;
		}

		sessionStorage.setItem(`${tabId}_${key}`, localStorageValue);
		return JSON.parse(localStorageValue);
    },
    setItem: (key: string, value: any) => {
        const tabId = getTabId();
        // Update both localStorage for overall persistence and sessionStorage for tab-specific state
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem(`${tabId}_${key}`, JSON.stringify(value));
    },
	removeItem: (key: string) => {
		const tabId = getTabId();
		localStorage.removeItem(key);
		sessionStorage.removeItem(`${tabId}_${key}`);
	}
};

export function atomWithTabStorage<T>(key: string, initialValue: T) {
	const baseAtom = atom((getTabStorage(key) ?? initialValue) as T);
	return atom(
		get => get(baseAtom),
		(get, set, update) => {
			set(baseAtom, update as T);
			setTabStorage(key, get(baseAtom));
		}
	)
}