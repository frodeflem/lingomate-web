import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export const useNavigationEvent = (onPathnameChange: (pathname: string) => void) => {
	const pathname = usePathname(); // Get current route
  
	// Save pathname on component mount into a REF
	const savedPathNameRef = useRef(pathname);
  
	useEffect(() => {
		// If REF has been changed, do the stuff
		if (savedPathNameRef.current !== pathname) {
			onPathnameChange(pathname);
			// Update REF
			savedPathNameRef.current = pathname;
		}
	}, [pathname, onPathnameChange]);
};
