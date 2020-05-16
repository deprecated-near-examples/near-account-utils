const fs = require("fs");
const path = require("path");
const got = require("got");
const api = require("near-api-js");

const pwd = process.cwd();
const config = require(`${pwd}/config`)("testnet");
const keystore = new api.keyStores.UnencryptedFileSystemKeyStore(pwd);

async function fetchStorage(account) {
  const { body } = await got.post("https://rpc.testnet.nearprotocol.com", {
    json: {
      jsonrpc: "2.0",
      id: "dontcare",
      method: "query",
      params: {
        request_type: "view_state",
        finality: "final",
        account_id: account,
        prefix_base64: "",
      },
    },
  });

  return body;
}

function hasContract(state) {
  if (state.code_hash === "11111111111111111111111111111111") {
    return false;
  } else {
    return state.code_hash.substring(0, 6);
  }
}

async function fetchAccessKeys(accountName) {
  const near = await api.connect({ ...config, deps: { keystore } });
  const account = await near.account(accountName);
  return await account.getAccessKeys();
}

async function fetchState(accountName) {
  const near = await api.connect({ ...config, deps: { keystore } });
  const account = await near.account(accountName);
  const state = await account.state();
  Object.assign(state, {
    formattedAmount: api.utils.format.formatNearAmount(state.amount),
  });
  return state;
}

function privateKeyFromFile(file) {
  const contents = fs.readFileSync(file);
  return JSON.parse(contents).private_key;
}

function publicKeyFromPrivate(sk) {
  return keysFromString(sk).publicKey;
}

function publicKeyFromFile(file) {
  return publicKeyFromPrivate(privateKeyFromFile(file));
}

function keysFromString(privateKey) {
  const keys = api.utils.key_pair.KeyPairEd25519.fromString(privateKey);
  // const keys = utils.key_pair.KeyPairEd25519.fromRandom()

  return {
    publicKey: keys.publicKey.toString(),
    secretKey: keys.secretKey,
  };
}

function fetchAccounts(credentialStore, network = "testnet") {
  const folders = {
    testnet: "default",
  };

  return fetchLocalKeys(credentialStore, folders[network]).reduce(
    (results, keyFilePath) => {
      const account = keyFilePath.split("/").slice(-1)[0].replace(".json", "");
      results[account] = keyFilePath;
      return results;
    },
    {}
  );
}

function fetchLocalKeys(credentialStore, network = "default") {
  if (!credentialStore) {
    throw new Error("Missing entry level folder for NEAR account credentials");
  }

  const networkFilter = RegExp(network);

  return readDirR(credentialStore)
    .filter((entry) => networkFilter.test(entry))
    .filter((entry) => typeof entry == "string");
}

// prettier-ignore
function readDirR(dir) {
  return fs.statSync(dir).isDirectory()
    ? [Array.prototype].concat(...fs.readdirSync(dir).map(f => readDirR(path.join(dir, f))))
    : dir;
}

module.exports = {
  hasContract,
  fetchState,
  keysFromString,
  privateKeyFromFile,
  publicKeyFromPrivate,
  publicKeyFromFile,
  fetchAccounts,
  fetchLocalKeys,
  fetchAccessKeys,
  fetchStorage,
};
