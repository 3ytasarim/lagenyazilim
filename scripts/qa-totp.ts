/** QA yardımcı: verilen base32 sırrı için güncel TOTP kodunu yazar (yalnızca yerel test). */
import { currentStep, totpAt } from "../src/lib/auth/totp";

const secret = process.argv[2] ?? "";
const offset = Number(process.argv[3] ?? 0);
process.stdout.write(totpAt(secret, currentStep() + offset));
