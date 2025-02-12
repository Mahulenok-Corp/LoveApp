import { UUID } from "crypto";

export function createInvoiceTextDailyTask(dayToSkip: number, amount: number, _payload: UUID) {
  const title = `Skip Day`;
  const description = `Skip day ${dayToSkip} for ${amount}`;
  const payload = _payload;
  const providerToken = "";
  const currency = "XTR";
  const prices = [{ amount, label: `Day ${dayToSkip}` }];

  return { title, description, payload, provider_token: providerToken, currency, prices };
}
