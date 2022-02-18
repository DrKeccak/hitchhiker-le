import React from "react";
import { useEthers } from "@usedapp/core";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import "./App.css";
import { useHitchhikerLE } from "./hooks/useHitchhikerLE";

const walletconnect = new WalletConnectConnector({
  rpc: {
    1:
      process.env.WEB3_API ||
      "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
  },
  qrcode: true,
});

function Mint() {
  const { activateBrowserWallet, activate, library, account } = useEthers();
  const { eligible, claimableAmount, mintableUntil, claim } = useHitchhikerLE(
    0,
    library,
    account || undefined
  );
  return (
    <div>
      {!library ? (
        <>
          <button onClick={() => activateBrowserWallet()}>Use metamask</button>
          <button onClick={() => activate(walletconnect)}>
            Use WalletConnect
          </button>
        </>
      ) : (
        <p>Connected: {account} </p>
      )}
      <p>Eligible: {eligible ? "true" : "false"}</p>
      <p>Mintable: {claimableAmount}</p>
      <p>Claimable until: {mintableUntil?.toString()}</p>
      <button disabled={!eligible} onClick={claim}>
        {eligible
          ? "Mint with a merkle proof"
          : "You're not eligible for the claim"}
      </button>
    </div>
  );
}

export default Mint;
