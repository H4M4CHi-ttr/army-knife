import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRustNotices } from './build-rust-notices.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = join(root, 'crates/army-knife-core/Cargo.toml');
const cargoManifest = readFileSync(manifest, 'utf8');
const version = /^wasm-bindgen\s*=\s*"=([^"]+)"$/m.exec(cargoManifest)?.[1];
if (!version) throw new Error('The Rust manifest must pin an exact wasm-bindgen version.');

const bindingTool = spawnSync('wasm-bindgen', ['--version'], { encoding: 'utf8', shell: false });
if (bindingTool.error || bindingTool.status !== 0 || bindingTool.stdout.trim() !== `wasm-bindgen ${version}`) {
  console.error(`Install the matching WASM binding tool: cargo install wasm-bindgen-cli --version ${version} --locked`);
  process.exit(1);
}

const cargo = spawnSync('cargo', [
  'build', '--manifest-path', manifest, '--target', 'wasm32-unknown-unknown', '--release', '--locked',
], { cwd: root, stdio: 'inherit', shell: false });
if (cargo.error || cargo.status !== 0) {
  console.error('WASM build failed. Install Rust and run: rustup target add wasm32-unknown-unknown');
  process.exit(cargo.status || 1);
}

const output = join(root, 'src/lib/wasm/pkg');
// This directory contains generated build output only.
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const binding = spawnSync('wasm-bindgen', [
  join(root, 'crates/army-knife-core/target/wasm32-unknown-unknown/release/army_knife_core.wasm'),
  '--target', 'web', '--out-dir', output, '--out-name', 'army_knife_core',
], { cwd: root, stdio: 'inherit', shell: false });
if (binding.error || binding.status !== 0) process.exit(binding.status || 1);
buildRustNotices();
console.log('Built the local Rust WASM engine.');
