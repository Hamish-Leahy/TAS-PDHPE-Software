// We'll use Web Crypto API instead of Node's crypto module
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Convert password to buffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password + saltHex);
  
  // Hash the password + salt using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  
  // Convert password + salt to buffer
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  
  // Hash the password + salt
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const testHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hash === testHash;
}