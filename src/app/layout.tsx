"use client";
import { Inter } from 'next/font/google'
import './globals.css'
import { useEffect, useState } from 'react';
import React from 'react';
import { AuthGuard } from '@/utils/Auth';
import { ThemeProvider, createTheme } from '@mui/material';

declare module '@mui/material/styles' {
	interface Palette {
		custom: Palette['primary'];
	}
	
	interface PaletteOptions {
		custom?: PaletteOptions['primary'];
	}

	interface Theme {
		status: {
		danger: string;
		};
	}
	// allow configuration using `createTheme`
	interface ThemeOptions {
		status?: {
		danger?: string;
		};
	}
}

// Roboto font:
const inter = Inter({ subsets: ['latin'], display: 'swap' })

function DisableSSR({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);
	
	useEffect(() => {
		setMounted(true);
	}, []);
	
	if (!mounted) {
		return null;
	}
	
	return <>{children}</>;
}

const darkTheme = createTheme({
	palette: {
	mode: 'dark',
	},
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<div className="fixed top-0 left-0 right-0 bottom-0" style={{ backgroundImage: 'linear-gradient(to bottom, #2A2E43, #13151F)' }}/>
				<DisableSSR>
					<AuthGuard>
						<ThemeProvider theme={darkTheme}>
							<div className="flex flex-row max-h-screen">
								<div className="flex flex-col items-center justify-start w-full absolute">
									{children}
								</div>
							</div>
						</ThemeProvider>
					</AuthGuard>
				</DisableSSR>
			</body>
		</html>
	);
}
