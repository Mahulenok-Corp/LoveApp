import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { Api } from "telegram/tl";
import input from "input";
import "dotenv/config";
const apiId = 20150443;
const apiHash = "68c0ae0eafa73ca7c3b426a1fa75417f";
const sessionString = process.env.X_SESSION_STRING;
const BOT_API_KEY = process.env.BOT_API_KEY!; // put your bot token here

// Function to create new session
async function getSession() {
  const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
    connectionRetries: 5,
  });

  try {
    console.log("Starting connection...");

    await client.start({
      phoneNumber: async () => await input.text("Enter phone number: "),
      password: async () => await input.text("Enter password (if 2FA enabled): "),
      phoneCode: async () => await input.text("Enter code received: "),
      onError: (err) => console.log(err),
    });

    console.log("Connected successfully!");
    const sessionString = client.session.save();
    console.log("Session string:", sessionString);

    return client;
  } catch (err) {
    console.error("Error in getSession:", err);
    throw err;
  }
}

// Function to use existing session
async function useExistingSession(sessionString, targetUserId) {
  const client = new TelegramClient(new StringSession(sessionString), parseFloat(apiId), apiHash, {
    connectionRetries: 5,
  });

  try {
    await client.connect();
    console.log("Connected with existing session");
    console.log(1);
    console.log(2);
    console.log(3);
    // const d = await client.getMessages(7309331954);
    // console.log(d);
    // await client.getDialogs();
    // await client.getDialogs();
    const user = await client.getInputEntity(
      "@justagent5"
      // new Api.InputPeerUser({
      //   userId: BigInt(822272964),
      //   accessHash: 7965821459962897482n, //-7600975699664666408n
      // })
    );
    console.log(user);
    // console.log(user.accessHash);
    return;
    // Try different methods to get user
    try {
      // Method 1: Direct entity fetch
      const user = await client.getEntity(targetUserId);
      console.log(user);
      const result = await client.invoke(
        new Api.payments.GetUserStarGifts({
          userId: new Api.InputUser({
            userId: BigInt(user.id),
            accessHash: user.accessHash || BigInt(0),
          }),
          offset: "",
          limit: 100,
        })
      );

      // console.log("Star gifts result:", result);
      for (const r of result.gifts) {
        let ad = r.gift.sticker.thumbs;
        for (const q of ad) {
          console.log(q.bytes);
        }
      }
      return result;
    } catch (entityError) {
      console.log("Failed to get entity directly, trying alternative methods...");

      // Method 2: Try to resolve username if it's a username
      try {
        if (targetUserId.startsWith("@")) {
          const user = await client.getEntity(targetUserId);
          const result = await client.invoke(
            new Api.payments.GetUserStarGifts({
              userId: new Api.InputUser({
                userId: BigInt(user.id),
                accessHash: user.accessHash || BigInt(0),
              }),
              offset: "",
              limit: 100,
            })
          );

          return result;
        }
      } catch (usernameError) {
        console.log("Failed to resolve username:", usernameError);
      }

      // Method 3: Try to get from dialogs
      try {
        const dialogs = await client.getDialogs({});
        console.log("DIALOGS");
        console.log(dialogs);
        for (const dialog of dialogs) {
          if (dialog.entity.id.toString() === targetUserId) {
            const user = dialog.entity;
            const result = await client.invoke(
              new Api.payments.GetUserStarGifts({
                userId: new Api.InputUser({
                  userId: BigInt(user.id),
                  accessHash: user.accessHash || BigInt(0),
                }),
                offset: "",
                limit: 100,
              })
            );
            for (const r of result.gifts) {
              console.log(r.gift);
            }
            return result;
          }
        }
      } catch (dialogsError) {
        console.log("Failed to get from dialogs:", dialogsError);
      }

      throw new Error("Could not find user through any method");
    }
  } catch (err) {
    // console.error("Error using existing session:", err);
    throw err;
  } finally {
    // await client.disconnect();
  }
}

getSession()
  .then(async (client) => {
    await client.disconnect();
  })
  .catch(console.error);

// const stringSession = "";

// (async () => {
//   const client = new TelegramClient(new StringSession(stringSession), 20408492, "b86e6208247ac421736a22d78b50e7ae", {
//     connectionRetries: 5,
//   });
//   await client.start({
//     botAuthToken: "8151558914:AAF6IOFMYD7M4V7eN-2t9CNykHSvBVg8Do4",
//   });
//   console.log(client.session.save());
// })();

// @asdad21312312ssefw_bot
const savedSessionString =
  "1AgAOMTQ5LjE1NC4xNjcuNTEBu4mRdzOC527xEwWxmo48H3vg75PXBQugqrCRMcPJ+BFrrGXtpy5ZguPMyhQ8dN+h9XP9K+f2E2EVQYkISLXqAGdFQ8Vmw9fATZGNXxUZSvYXHThBsjunrjkASjxOdBkfFHOlmqFsFnjz0nQVqJ+Ifg7ppVOQy6G0VNacG8WsfmNxOp5Ul1XX4saNmu3fuzmUgyWdCeB3p3QMhX+dHyk05/YDN3WVWvrnkayU6qSqjtRQH/Sk5/QgdbpoAiEukeei3pEbNLQeLbcYhZx5j2zNFWyqN4YjPgPi7rpfAKzZF68qhFeKqvQqqavD/zEObFGJ1N8+GIdR402EGRNRp/Ds93M=";
const targetUserId = "@justagent5"; // or "@username"

//7309331954n user
const savedSessionString2 =
  "1AgAOMTQ5LjE1NC4xNjcuNTEBu3il3YR1idvwLVkW39K2OAEQEc+RNfbwlNe/DvgVYvFZf5U3WSCOOkBJMlaoaa9LiKBWwM3SCmEWdNtrfjnv7DPeBfYxgOu8kzLXemTQo2eMVYdcjpEg1XIa06fG4CknxFxOs3RPy/L6lo9UdDWcHlo3xC517Uq824+3z+A7gNptcujTc2OgY5ijObw0wlyAquJdeYafBF3+TJ+2sEr0aVUs1wexW+GVH2qMqs9ja4Uraw3Yb4z3tbfQ/uhBKp5Czr34vIH7uWJPVjySuHgs8ZK5qUVfAUqi0yN6PJmehILRkVNawwnM40Lp8FphGYf48ALrHjpELV22ZHPX50FQPyI=";
// useExistingSession(savedSessionString, targetUserId);
// useExistingSession(savedSessionString2, targetUserId);

// {
//   CONSTRUCTOR_ID: 3723011404,
//   SUBCLASS_OF_ID: 3374092470,
//   className: 'InputPeerUser',
//   classType: 'constructor',
//   userId: Integer { value: 822272964n },
//   accessHash: Integer { value: -7600975699664666408n }
// }

// {
//   CONSTRUCTOR_ID: 3723011404,
//   SUBCLASS_OF_ID: 3374092470,
//   className: 'InputPeerUser',
//   classType: 'constructor',
//   userId: Integer { value: 822272964n },
//   accessHash: Integer { value: 7965821459962897482n }
// }
