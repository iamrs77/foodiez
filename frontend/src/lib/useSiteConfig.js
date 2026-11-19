import { useGetConfigQuery } from '../app/api';

// what this site offers. If the API can't answer, it behaves like a local copy:
// sign-ups and the shared demo accounts on, no private demos. Parts that differ
// between sites wait for `isLoading` to end, so they don't flash on screen
export function useSiteConfig() {
	const { data, isLoading } = useGetConfigQuery();
	return {
		isLoading,
		signupsEnabled: data?.signupsEnabled ?? true,
		demoEnabled: data?.demoEnabled ?? false,
		demoAccountsLogin: data?.demoAccountsLogin ?? true,
		demoHours: data?.demoHours ?? 24,
	};
}
