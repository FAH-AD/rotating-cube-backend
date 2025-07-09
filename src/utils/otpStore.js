const otpMap = new Map(); // { phone: { code, expiresAt } }

export const storeOTP = (phone, code) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpMap.set(phone, { code, expiresAt });
};

export const getStoredOTP = (phone) => {
  const data = otpMap.get(phone);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    otpMap.delete(phone);
    return null;
  }
  return data.code;
};

export const deleteOTP = (phone) => {
  otpMap.delete(phone);
};
