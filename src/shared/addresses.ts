import "dotenv/config";

export type AvailableHandlers = "payment";

export const AvailableAddresses: {
  [key in AvailableHandlers]: string;
} = {
  payment: process.env.ACCOUNT_HEX,
};
