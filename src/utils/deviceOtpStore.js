// utils/deviceOtpStore.js
const deviceOtpMap = new Map();

export function storeDeviceOTP(email, fingerprint, code) {
  const key = `${email}:${fingerprint}`;
  deviceOtpMap.set(key, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
}

export function getDeviceOTP(email, fingerprint) {
  const key = `${email}:${fingerprint}`;
  const record = deviceOtpMap.get(key);
  if (!record || Date.now() > record.expiresAt) return null;
  return record.code;
}

export function deleteDeviceOTP(email, fingerprint) {
  const key = `${email}:${fingerprint}`;
  deviceOtpMap.delete(key);
}
