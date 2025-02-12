export const messages = {
  welcome: `The gifts are ready to open up from a new angle. Join us to get $PX`,
  buttons: {
    subscribe: "Not Gift community",
    howToEarn: "More info",
    play: "🎁 Let's go!",
  },
};

export const messagesWithdraw = (lg: string, amount: number) => {
  if (lg === "ru") {
    return {
      complete: `✅ Вывод средств на сумму ${amount} Ton успешно исполнен.`,
      pending: `⏳Вывод средств на сумму ${amount} Ton успешно зарегистрирован.`,
    };
  }
  return {
    complete: `Withdrawal of funds in the amount of ${amount} Ton has been successfully completed`,
    pending: `⏳The withdrawal of funds in the amount of ${amount} Ton has been successfully registered.`,
  };
};
