import { atom } from "jotai";
import { atomWithRefresh } from "./ApiResource";
import { API_HOST } from "@/env";
import { atomWithStorage } from "jotai/utils";
import { UserApi, PublicApi } from "./api";
import { atomWithTabStorage } from "./tabStorage";


// Public API atom example
// export const accountIdAtom = atomWithTabStorage("accountId", null as number | null);

// export const { remoteAtom: oasisTypesAtom, refreshRemoteAtom: refreshOasisTypesAtom } = atomWithRefresh(async get => {
// 	return await PublicApi.getOasisTypes();
// });

// export const oasisTypesMapAtom = atom(async get => {
// 	const list = await get(oasisTypesAtom);
// 	let map = new Map<number, OasisTypeDto>();

// 	if (list) {
// 		for (const item of list) {
// 			map.set(item.id, item);
// 		}
// 	}

// 	return map;
// });



// Protected API atom example
// export const { remoteAtom: adminAccountsAtom, refreshRemoteAtom: refreshAdminAccountsAtom } = atomWithRefresh(async get => {
// 	return await AdminApi.getAdminAccounts();
// });

// export const adminAccountsMapAtom = atom(async get => {
// 	const list = await get(adminAccountsAtom);
// 	let map = new Map<number, AccountDto>();

// 	if (list) {
// 		for (const item of list) {
// 			map.set(item.id, item);
// 		}
// 	}

// 	return map;
// });
