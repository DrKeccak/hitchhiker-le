import React, { useCallback, useEffect, useState } from "react";
import { ethers, providers } from "ethers";
import { getAddress } from "ethers/lib/utils";
import { HitchhikerLE__factory, utils } from "contracts";
import data from "contracts/airdrops/0.json";

type AirdropData = {
  [key: string]: number;
};

const airdrapData = data as AirdropData;

const getContract = (lib: ethers.providers.Provider) => {
  const contract = HitchhikerLE__factory.connect(
    process.env.CONTRACT_ADDRESS ||
      "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    lib
  );
  return contract;
};

export const useHitchhikerLE = (
  id: number,
  lib?: providers.Web3Provider,
  account?: string
): {
  eligible: boolean;
  mintableUntil?: Date;
  claimableAmount?: number;
  claim: () => Promise<ethers.ContractTransaction | undefined>;
} => {
  const eligible = !!(
    !!account && Object.keys(airdrapData).find((k) => getAddress(k) === account)
  );

  // claimable amount
  const [claimableAmount, setClaimableAmount] = useState<number>();
  const updateClaimableAmount = useCallback(async () => {
    if (!lib || !account) {
      setClaimableAmount(undefined);
      return;
    }
    const eligibleAcc = Object.keys(airdrapData).find(
      (k) => getAddress(k) === account
    );
    if (!eligibleAcc) return 0;
    const assigned = airdrapData[eligibleAcc];
    const claimed = (await getContract(lib).claimed(id, account)).toNumber();
    const claimable = assigned - claimed;
    setClaimableAmount(claimable);
  }, [id, account, lib]);
  // mintable until
  const [mintableUntil, setMintableUntil] = useState<Date>();
  const updateClaimableUntil = useCallback(async () => {
    if (!lib || !account) {
      setMintableUntil(undefined);
      return;
    }
    const claimableUntil = (
      await getContract(lib).mintableUntil(id)
    ).toNumber();
    const d = new Date(claimableUntil * 1000);
    setMintableUntil(d);
  }, [id, account, lib]);

  useEffect(() => {
    updateClaimableAmount();
    updateClaimableUntil();
    lib?.on("block", updateClaimableAmount);
    lib?.on("block", updateClaimableUntil);
    return () => {
      lib?.off("block", updateClaimableAmount);
      lib?.off("block", updateClaimableUntil);
    };
  }, [lib, updateClaimableAmount, updateClaimableUntil]);

  const claim = useCallback(async () => {
    if (!lib || !account) {
      alert("Connect wallet first");
      return;
    }
    const signer = lib.getSigner();
    const contract = HitchhikerLE__factory.connect(
      process.env.CONTRACT_ADDRESS ||
        "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      lib
    );
    try {
      const proof = utils.merkleProof(
        Object.keys(airdrapData).map((key) => ({
          address: getAddress(key),
          amount: airdrapData[key] as number,
        })),
        account
      );
      const tx = await contract.connect(signer).claim(id, 1, 1, proof);
      return tx;
    } catch (e) {
      const message = (e as any).message;
      alert(message);
    }
  }, [id, lib, account]);
  return { eligible, claimableAmount, mintableUntil, claim };
};
