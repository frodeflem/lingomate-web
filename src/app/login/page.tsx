"use client"

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/utils/Auth';
import { Button, TextField } from '@mui/material';
import { useRouter } from 'next/navigation';
import { accessToken, isTokenValid } from '@/data/api';
import { atomWithTabStorage } from '@/data/tabStorage';
import { useAtom } from 'jotai';


const usernameAtom = atomWithTabStorage("username", "");
const passwordAtom = atomWithTabStorage("password", "");

const LoginPage: React.FC = () => {
	const router = useRouter();
	const [username, setUsername] = useAtom(usernameAtom);
	const [password, setPassword] = useAtom(passwordAtom);
	const { login: _login, isLoggedIn } = useAuth();

	useEffect(() => {
		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [username, password]);

	useEffect(() => {
		if (isLoggedIn) {
			router.push("/");
		}
	}, [isLoggedIn]);

	async function login() {
		await _login(username, password);
	}

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		login();
	};

	const handleKeyPress = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			login();
		}
	}

	if (isLoggedIn) return;

	return (
		<form onSubmit={handleSubmit}>
			<div className="flex flex-col items-center justify-center h-screen space-y-1">
				<TextField
					className="w-80"
					label="Username"
					variant="outlined"
					value={username}
					onChange={(e) => setUsername(e.target.value)}
				/>
				<TextField
					className="w-80"
					label="Password"
					variant="outlined"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Button type="submit" variant="outlined">Login</Button>
			</div>
		</form>
	);
};

export default LoginPage;