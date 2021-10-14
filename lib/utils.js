const fs = require("fs");
const path = require("path");
const got = require("got");
const api = require("near-api-js");

const keystore = new api.keyStores.InMemoryKeyStore();

const DEFAULT_CONFIG = getConfig(process.env.NEAR_ENV);

function getConfig(network = "testnet") {
  const pwd = process.cwd();
  return require(`${pwd}/config`)(network);
}

async function isValid(account, network = "testnet") {
  try {
    await fetchState(account, getConfig(network));
    return true;
  } catch (error) {
    if (/does not exist while viewing/.test(error)) {
      // invalid account
    } else {
      console.log(error);
    }
    return false;
  }
}

async function fetchStorage(account, network = "testnet") {
  if (!(await isValid(account, network))) return {};

  url = network === 'local' ? 'http://localhost:3030' : `https://rpc.${network}.near.org`

  const { body } = await got.post(`${url}`, {
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

async function fetchAccessKeys(accountName, config = DEFAULT_CONFIG) {
  const near = await api.connect({ ...config, deps: { keystore } });
  const account = await near.account(accountName);
  return await account.getAccessKeys();
}

async function fetchState(accountName, config = DEFAULT_CONFIG) {
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
  return fetchLocalKeys(credentialStore, network).reduce(
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
