"use client";

import { createApiResource, useResource } from "@/data/ApiResource";
import { UserApi, accessToken, setAccessToken } from "@/data/api";
import { UserDto } from "@/data/dtos";
import { useAuth } from "@/utils/Auth";
import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


const userResource = createApiResource<UserDto>({
	getFunc: async get => {
		return await UserApi.getUser();
	}
});


export default function Page() {
	const { latest: user } = useResource(userResource);
	const { logout } = useAuth();
	if (!user) return null;

	return (
		<main className="flex h-full min-h-screen flex-col items-center text-center justify-center">
			<div className="flex flex-col text-xl font-bold">
				<a>Welcome</a>
				<a>{user.email_address}</a>
				<div className="h-12"/>
			</div>
			<Button
				onClick={() => logout()}
				variant="contained"
			>
				Logout
			</Button>
		</main>
	)
}
