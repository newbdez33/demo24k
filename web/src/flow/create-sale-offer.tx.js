import * as fcl from "@onflow/fcl"
import * as t from "@onflow/types"
import {tx} from "./util/tx"

const CODE = fcl.cdc`
  import FungibleToken from 0xFungibleToken
  import NonFungibleToken from 0xNonFungibleToken
  import Kibble from 0xKibble
  import Karat from 0xKarat
  import KittyItems from 0xKittyItems
  import KittyItemsMarket from 0xKittyItemsMarket

  transaction(itemID: UInt64, price: UFix64, tokenID: UInt8) {
    let kibbleVault: Capability<&Kibble.Vault{FungibleToken.Receiver}>
    let karatVault: Capability<&Karat.Vault{FungibleToken.Receiver}>
    let kittyItemsCollection: Capability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>
    let marketCollection: &KittyItemsMarket.Collection

    prepare(signer: AuthAccount) {
        // we need a provider capability, but one is not provided by default so we create one.
        let KittyItemsCollectionProviderPrivatePath = /private/kittyItemsCollectionProvider

        self.kibbleVault = signer.getCapability<&Kibble.Vault{FungibleToken.Receiver}>(Kibble.ReceiverPublicPath)!
        assert(self.kibbleVault.borrow() != nil, message: "Missing or mis-typed Kibble receiver")

        self.karatVault = signer.getCapability<&Karat.Vault{FungibleToken.Receiver}>(Karat.ReceiverPublicPath)!
        assert(self.karatVault.borrow() != nil, message: "Missing or mis-typed Karat receiver")

        if let oldToken <- signer.load<@NonFungibleToken.Collection>(from: KittyItems.CollectionStoragePath) {
          destroy oldToken
        }
        signer.save(<-KittyItems.createEmptyCollection(), to: KittyItems.CollectionStoragePath)
        acct.unlink(KittyItems.CollectionPublicPath)
        acct.link<&KittyItems.Collection{NonFungibleToken.CollectionPublic, KittyItems.KittyItemsCollectionPublic}>(KittyItems.CollectionPublicPath, target: KittyItems.CollectionStoragePath)

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
            tokenID: tokenID,
            itemID: itemID,
            typeID: self.kittyItemsCollection.borrow()!.borrowKittyItem(id: itemID)!.typeID,
            sellerPaymentReceiver: self.kibbleVault,
            sellerKaratPaymentReceiver: self.karatVault,
            price: price
        )
        self.marketCollection.insert(offer: <-offer)
    }
}
`

export function createSaleOffer({itemID, price, tokenID}, opts = {}) {
  if (itemID == null)
    throw new Error("createSaleOffer(itemID, price, tokenID) -- itemID required")
  if (price == null)
    throw new Error("createSaleOffer(itemID, price, tokenID) -- price required")
  if (tokenID == null)
    throw new Error("createSaleOffer(itemID, price, tokenID) -- tokenID required")

  // prettier-ignore
  return tx([
    fcl.transaction(CODE),
    fcl.args([
      fcl.arg(Number(itemID), t.UInt64),
      fcl.arg(String(price), t.UFix64),
      fcl.arg(Number(tokenID), t.UInt8),
    ]),
    fcl.proposer(fcl.authz),
    fcl.payer(fcl.authz),
    fcl.authorizations([
      fcl.authz
    ]),
    fcl.limit(1000)
  ], opts)
}
