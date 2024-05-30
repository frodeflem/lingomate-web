"use client"

import { API_HOST } from "@/env";
import { getTabStorage, setTabStorage } from "./tabStorage";
import { AccessToken, BaseToken, RefreshToken } from "@/utils/Auth";
import { UserDto } from "./dtos";


export function isTokenValid(token: BaseToken | null): boolean {
	return !!(token && token.exp && token.exp * 1000 > Date.now());
}

function decodeToken(tokenString: string | null) {
	if (!tokenString) return null;
	return JSON.parse(atob(tokenString.split('.')[1]));
}

let accessTokenString: string | null = getTabStorage("accessToken");
export let accessToken: AccessToken | null = decodeToken(accessTokenString);
export function setAccessToken(tokenString: string) {
	accessTokenString = tokenString;
	accessToken = decodeToken(tokenString);
	setTabStorage("accessToken", accessTokenString);
}

let refreshTokenString: string | null = getTabStorage("refreshToken");
export let refreshToken: RefreshToken | null = decodeToken(refreshTokenString);
export function setRefreshToken(tokenString: string) {
	refreshTokenString = tokenString;
	refreshToken = decodeToken(tokenString);
	setTabStorage("refreshToken", refreshTokenString);
}

// Public API
export class PublicApi {
	static async GET(path: string) {
		const response = await fetch(`${API_HOST}${path}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async POST(path: string, body: any) {
		const response = await fetch(`${API_HOST}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async login(email_address: string, password: string) {
		const response = await this.POST('/login', {
			email_address: email_address,
			password: password
		});

		const data = await response.json();
		return data;
	}

	static async refreshAccessToken() {
		const response = await this.POST('/refresh-token', {
			refresh_token: refreshTokenString
		});

		const data = await response.json();
		setAccessToken(data.access_token);
	}

	static async getOasisTypes() {
		const response = await this.GET('/oasis_type');
		const data = await response.json();
		return data;
		// return data as OasisTypeDto[];
	}
};


// Protected API
export class UserApi {
	static async GET(path: string) {
		const response = await fetch(`${API_HOST}${path}`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${await this.accessTokenString()}`,
			},
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async POST(path: string, body: any) {
		const response = await fetch(`${API_HOST}${path}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${await this.accessTokenString()}`,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			console.error(response);
		}

		return response;
	}

	static async accessTokenString() {
		if (isTokenValid(accessToken)) return accessTokenString;

		if (isTokenValid(refreshToken)) {
			await PublicApi.refreshAccessToken();

			if (isTokenValid(accessToken)) {
				return accessTokenString;
			} else {
				throw new Error("Failed to refresh access token");
			}
		}

		if (!(typeof window === undefined)) {
			window.history.pushState(null, "", "/login");
			window.location.reload();
		}
		return null;
	}

	static async accessToken() {
		if (isTokenValid(accessToken)) return accessToken;

		if (isTokenValid(refreshToken)) {
			await PublicApi.refreshAccessToken();

			if (isTokenValid(accessToken)) {
				return accessToken;
			} else {
				throw new Error("Failed to refresh access token");
			}
		}

		if (!(typeof window === undefined)) {
			window.history.pushState(null, "", "/login");
			window.location.reload();
		}
		return null;
	}

	// static async getAdminAccounts() {
	// 	const response = await this.GET('/test-protected');
	// 	const data = await response.json();
	// 	return data;
	// 	// return data as AccountDto[];
	// }

	static async getUser() {
		const response = await this.GET('/user');
		const data = await response.json();
		return data as UserDto;
	}
};
