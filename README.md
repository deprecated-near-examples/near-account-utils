# NEAR Utilities

A collection of utilities to help with NEAR account management, development and troubleshooting

## Setup

- Clone this repo
- Run `yarn`

## Collecting Keys

Find all TestNet accounts and copy them to `~/.near-credentials`

_This is for Linux and macOS systems only_

- Run `yarn collect-keys`

## Accounts Report

Generate a report of accounts available on the NEAR network by scanning `~/.near-credentials` for all
files ending in .json

- Run `yarn accounts`

_Expected Output_

![Accounts Report](/assets/accounts-report-output.png)

## Account Keys Report

Generate a report of account keys on the NEAR network by scanning `~/.near-credentials` for all
files ending in .json

- Run `yarn keys`

_Expected Output_

**Testnet**

![Accounts Report Testnet](/assets/keys-report-output-testnet.png)

**Localnet**

![Accounts Report Localnet](/assets/keys-report-output-localnet.png)

## Storage Report

Generate a report of decoded state stored on an account

- Run `yarn storage <account>`

_Expected Output_

![Storage Report](/assets/storage-report-output.png)

_Alternate Expected Output_

![Storage Report with no output](/assets/storage-report-no-output.png)
