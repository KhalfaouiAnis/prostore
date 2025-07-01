const encoder = new TextEncoder();
const key = encoder.encode(process.env.ENCRYPTION_KEY);

export const hash = async (plainPassword: string): Promise<string> => {
  const passwordData = encoder.encode(plainPassword);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign", "verify"]
  );

  const hashBuffer = await crypto.subtle.sign("HMAC", cryptoKey, passwordData);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString().padStart(2, "0"))
    .join("");
};

export const compare = async (
  plainPassword: string,
  encryptedPassword: string
): Promise<boolean> => {
  const hashedPassword = await hash(plainPassword);

  return hashedPassword === encryptedPassword;
};
