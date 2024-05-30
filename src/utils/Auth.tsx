import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { atom, useAtom } from 'jotai';
import { useNavigationEvent } from './useNavigationEvent';
import { PublicApi, isTokenValid, refreshToken, setAccessToken, setRefreshToken } from '@/data/api';


export interface BaseToken {
	sub: string;
	exp: number;
};

export interface AccessToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
	fresh: boolean;
}

export interface RefreshToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
}

export interface UserAccessToken extends BaseToken {
	iat: number;
	nbf: number;
	jti: string;
	type: string;
	fresh: boolean;
	host: string;
};


const isLoggedInAtom = atom(isTokenValid(refreshToken));

export function useAuth() {
	const [isLoggedIn, setIsLoggedIn] = useAtom(isLoggedInAtom);
	
	async function login(username: string, password: string) {
		const response = await PublicApi.login(username, password);

		setAccessToken(response.access_token);
		setRefreshToken(response.refresh_token);
		setIsLoggedIn(isTokenValid(refreshToken));
		return response;
	}

	function logout() {
		setAccessToken("");
		setRefreshToken("");
		setIsLoggedIn(false);
	}

	return {login, isLoggedIn, logout};
}


interface AuthGuardProps {
	defaultLoginRedirect?: string;
	publicPaths?: string[];
}

export function AuthGuard({
	children,
	publicPaths = ['/login', '/jotai']
}: PropsWithChildren<AuthGuardProps>) {
	const router = useRouter();
	const pathname = usePathname();
	const {isLoggedIn} = useAuth();
	const isPublicPath = publicPaths.includes(pathname);
	const displayChildren = isLoggedIn || isPublicPath;

	useNavigationEvent(redirectIfUnauthorized);

	useEffect(() => {
		redirectIfUnauthorized();
	}, [pathname, redirectIfUnauthorized]);

	function redirectIfUnauthorized() {
		if (!displayChildren) {
			router.push('/login');
		}
	}

	if (displayChildren) {
		return children;
	}
}
