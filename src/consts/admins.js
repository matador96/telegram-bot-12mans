const adminTelegramIds = [462967909, 167439595, 991236913];

const isAdmin = (tgId) => {
  return adminTelegramIds.includes(tgId);
};

module.exports = { adminTelegramIds, isAdmin };
