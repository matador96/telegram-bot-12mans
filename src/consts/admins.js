const adminTelegramIds = [462967909];

const isAdmin = (tgId) => {
  return adminTelegramIds.includes(tgId);
};

module.exports = { adminTelegramIds, isAdmin };
