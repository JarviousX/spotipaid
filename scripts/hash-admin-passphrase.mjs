/**
 * Hash an admin passphrase for ADMIN_PASSPHRASE_HASH.
 * Usage: node scripts/hash-admin-passphrase.mjs
 * Reads passphrase from stdin (never pass via argv in shared shells if avoidable).
 * Does not print or store the plaintext.
 */
import bcrypt from "bcryptjs";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stderr,
});

rl.question("Passphrase (input hidden in most terminals): ", async (pass) => {
  rl.close();
  const trimmed = pass.trim();
  if (trimmed.length < 12) {
    console.error("Passphrase too short (min 12).");
    process.exit(1);
  }
  const hash = await bcrypt.hash(trimmed, 12);
  const escaped = hash.replaceAll("$", "\\$");
  process.stdout.write(`${escaped}\n`);
  console.error(
    "\nSet ADMIN_PASSPHRASE_HASH to the escaped value above (\$ preserved).",
  );
  console.error("Never commit the plaintext passphrase.");
});
