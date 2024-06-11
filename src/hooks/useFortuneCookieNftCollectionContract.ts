import { useEffect, useState } from "react";
import { FortuneCookieNftCollection } from "../contracts/FortuneCookieNftCollection";
import { useTonClient } from "./useTonClient";
import { useAsyncInitialize } from "./useAsyncInitialize";
import { Address, OpenedContract } from "@ton/core";
import { useTonConnect } from "./useTonConnect";
import { ADDRESSES } from "../addresses";


export type FortuneCookieNftCollectionData = {
  ownerAddress: Address,
  nextItemId: number,
  content: string
};

export function useFortuneCookieNftCollectionContract() {
  const tonClient = useTonClient();
  const { sender } = useTonConnect();

  const [contractData, setContractData] = useState<null | FortuneCookieNftCollectionData>();

  const [balance, setBalance] = useState<null | number>(null);

  const nftCollectionContract = useAsyncInitialize(async () => {
    if (!tonClient) {
      return;
    }

    const address = Address.parse(ADDRESSES.testnet.collectionContract);
    const contract = new FortuneCookieNftCollection(address);
    return tonClient.open(contract) as OpenedContract<FortuneCookieNftCollection>;
  }, [tonClient]);

  async function fetchData() {
    if (!nftCollectionContract) {
      return;
    }

    setContractData(null);
    const data = await nftCollectionContract.getCollectionData();
    const balance = await nftCollectionContract.getBalance();
    setContractData({
      ownerAddress: data.ownerAddress,
      nextItemId: data.nextItemId,
      content: data.collectionContent
    });
    setBalance(Number(balance));
  }

  useEffect(() => {
    fetchData();
  }, [nftCollectionContract]);

  return {
    contractAddress: nftCollectionContract?.address.toString(),
    contractBalance: balance,
    contractData: contractData,
    sendMint: async() => {
      const address = sender.address ?? Address.parse(ADDRESSES.testnet.owner);
      if (!address) {
        alert("No address");
        return;
      } else {
        alert("Address: " + address.toString());
      }
      await nftCollectionContract?.sendDeployNewNft(sender, {
        queryId: 124,
        itemInput: {
          index: contractData?.nextItemId ?? 0,
          ownerAddress: address, 
          lowerBound: 0,
          upperBound: 100,
          content: "A.json"
        }
      });
      fetchData();
    },
    sendDeposit: async(amount: number) => {
      await nftCollectionContract?.sendDeploy(sender, BigInt(amount));
      fetchData();
    },
    sendEditContent: async(newContent: string) => {
      return nftCollectionContract?.sendEditContent(sender, {
        queryId: 123,
        collectionContent: newContent + "collectionCover.json",
        commonContent: newContent,
        royaltyParams: {
          royaltyFactor: 5,
          royaltyBase: 10,
          royaltyAddress: sender.address ?? new Address(0, Buffer.alloc(32, 0))
        }
      });
    },
    refresh: async() => {
      fetchData()
    }
  }
}
