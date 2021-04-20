import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"
import {tx} from "./util/tx"

const CODE = fcl.cdc`
  import FungibleToken from 0xFungibleToken
  import NonFungibleToken from 0xNonFungibleToken
  import Karat from 0xKarat
  import KittyItems from 0xKittyItems
  import KittyItemsMarket from 0xKittyItemsMarket

  transaction(itemID: UInt64, price: UFix64) {
    let karatVault: Capability<&Karat.Vault{FungibleToken.Receiver}>
    let kittyItemsCollection: Capability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>
    let marketCollection: &KittyItemsMarket.Collection

    prepare(signer: AuthAccount) {
        // we need a provider capability, but one is not provided by default so we create one.
        let KittyItemsCollectionProviderPrivatePath = /private/kittyItemsCollectionProvider

        self.karatVault = signer.getCapability<&Karat.Vault{FungibleToken.Receiver}>(Karat.ReceiverPublicPath)!
        assert(self.karatVault.borrow() != nil, message: "Missing or mis-typed Karat receiver")

        if !signer.getCapability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath)!.check() {
            signer.link<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath, target: KittyItems.CollectionStoragePath)
        }

        self.kittyItemsCollection = signer.getCapability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath)!
        assert(self.kittyItemsCollection.borrow() != nil, message: "Missing or mis-typed KittyItemsCollection provider")

        self.marketCollection = signer.borrow<&KittyItemsMarket.Collection>(from: KittyItemsMarket.CollectionStoragePath)
            ?? panic("Missing or mis-typed KittyItemsMarket Collection")
    }

    execute {
        let offer <- KittyItemsMarket.createSaleOffer (
            sellerItemProvider: self.kittyItemsCollection,
            itemID: itemID,
            typeID: self.kittyItemsCollection.borrow()!.borrowKittyItem(id: itemID)!.typeID,
            sellerPaymentReceiver: self.karatVault,
            price: price
        )
        self.marketCollection.insert(offer: <-offer)
    }
}
`

export function createKaratSaleOffer({itemID, price}, opts = {}) {
  if (itemID == null)
    throw new Error("createSaleOffer(itemID, price) -- itemID required")
  if (price == null)
    throw new Error("createSaleOffer(itemID, price) -- price required")

  // prettier-ignore
  return tx([
    fcl.transaction(CODE),
    fcl.args([
      fcl.arg(Number(itemID), t.UInt64),
      fcl.arg(String(price), t.UFix64),
    ]),
    fcl.proposer(fcl.authz),
    fcl.payer(fcl.authz),
    fcl.authorizations([
      fcl.authz
    ]),
    fcl.limit(1000)
  ], opts)
}
