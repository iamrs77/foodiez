// node scripts/run-in.mjs <folder> <npm command...>
// Runs an npm command inside backend/ or frontend/ for the root package.json scripts.
// npm tells every script where the root project is (npm_config_local_prefix); a
// nested npm would pick that up and act on the root project again, so it's removed.
import { spawnSync } from 'node:child_process';

const [folder, ...command] = process.argv.slice(2);
const env = { ...process.env };
delete env.npm_config_local_prefix;

const { status } = spawnSync(`npm ${command.join(' ')}`, {
	cwd: folder,
	env,
	stdio: 'inherit',
	shell: true,
});
process.exit(status ?? 1);
