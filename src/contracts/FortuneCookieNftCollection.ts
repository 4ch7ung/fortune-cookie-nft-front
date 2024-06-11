import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, fromNano, Sender, SendMode, toNano } from '@ton/core';
import { decodeOffChainContent } from './nftContentUtils';
import { RoyaltyParams, FortuneCookieNftCollectionData, FortuneCookieCollectionMintItemInput, Queries, buildNftCollectionStateInit } from './FortuneCookieNftCollection.data';


const nftMinStorage = 0.05;
const gasPerItem = 0.015;
        

export class FortuneCookieNftCollection implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new FortuneCookieNftCollection(address);
    }

    static createFromConfig(config: FortuneCookieNftCollectionData, code: Cell, workchain = 0) {
        const { stateInit } = buildNftCollectionStateInit(config, code);
        return new FortuneCookieNftCollection(contractAddress(workchain, stateInit), stateInit);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    //
    // Get methods
    //

    async getCollectionData(provider: ContractProvider) {
        const { stack } = await provider.get('get_collection_data', []);
        
        return {
            nextItemId: stack.readNumber(),
            collectionContent: decodeOffChainContent(stack.readCell()),
            ownerAddress: stack.readAddress()
        }
    }

    async getBalance(provider: ContractProvider) {
        const { balance } = await provider.getState();
        return fromNano(balance);
    }

    async getNftAddressByIndex(provider: ContractProvider, index: number) {
        const { stack } = await provider.get('get_nft_address_by_index', [{
            type: 'int',
            value: BigInt(index)
        }])
        return stack.readAddress()
    }

    async getRoyaltyParams(provider: ContractProvider): Promise<RoyaltyParams> {
        let { stack } = await provider.get('royalty_params', [])

        return {
            royaltyFactor: stack.readNumber(),
            royaltyBase: stack.readNumber(),
            royaltyAddress: stack.readAddress()
        }
    }

    async getNftContent(provider: ContractProvider, index: number, nftIndividualContent: Cell): Promise<string> {
        let { stack } = await provider.get('get_nft_content', [
            { type: 'int', value: BigInt(index) },
            { type: 'cell', cell: nftIndividualContent }
        ])

        return decodeOffChainContent(stack.readCell())
    }

    // Test methods

    async sendExternalMessage(provider: ContractProvider) {
        return await provider.external(beginCell().endCell());
    }

    //
    // Internal messages
    //

    async sendDeployNewNft(
        provider: ContractProvider,
        sender: Sender,
        params: { queryId?: number, itemInput: FortuneCookieCollectionMintItemInput }
    ) {
        const nftStorage = params.itemInput.passAmount ?? toNano(nftMinStorage);
        let msgBody = Queries.mint(params)
        
        return await provider.internal(sender, {
            value: nftStorage + toNano(gasPerItem),
            bounce: false,
            body: msgBody
        });
    }

    async sendBatchDeployNft(
        provider: ContractProvider,
        sender: Sender,
        params: { queryId?: number, items: FortuneCookieCollectionMintItemInput[] }
    ) {
        const value = toNano((nftMinStorage + gasPerItem) * params.items.length);
        let msgBody = Queries.batchMint(params)

        return await provider.internal(sender, {
            value: value,
            bounce: false,
            body: msgBody
        });
    }

    async sendChangeOwner(
        provider: ContractProvider,
        sender: Sender,
        newOwner: Address
    ) {
        let msgBody = Queries.changeOwner({ newOwner })

        return await provider.internal(sender, {
            value: toNano(0.05),
            bounce: false,
            body: msgBody
        });
    }

    async sendGetRoyaltyParams(
        provider: ContractProvider,
        sender: Sender
    ) {
        let msgBody = Queries.getRoyaltyParams({})

        return await provider.internal(sender, {
            value: toNano(0.05),
            bounce: false,
            body: msgBody
        });
    }

    /* not implemented, contract is not editable */
    async sendEditContent(
        provider: ContractProvider,
        sender: Sender,
        params: { queryId?: number,  collectionContent: string, commonContent: string,  royaltyParams: RoyaltyParams }
    ) {
        let msgBody = Queries.editContent(params)

        return await provider.internal(sender, {
            value: toNano(0.05),
            bounce: false,
            body: msgBody
        });
    }
}
