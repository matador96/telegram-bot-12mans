const closeCtx = async (ctx, message = null, showAlert = true) => {
  if (typeof ctx.answerCbQuery === "function") {
    if (message) {
      await ctx.answerCbQuery(message, {
        show_alert: showAlert,
      });
    } else {
      await ctx.answerCbQuery();
    }
  } else {
    console.log("Метод ctx.answerCbQuery не доступен.");
  }
};

module.exports = {
  closeCtx,
};
