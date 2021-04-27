// prettier-ignore
import {transaction, limit, proposer, payer, authorizations, authz, cdc} from "@onflow/fcl"
import {invariant} from "@onflow/util-invariant"
import {tx} from "./util/tx"

const CODE = cdc`
  import FungibleToken from 0xFungibleToken
  import NonFungibleToken from 0xNonFungibleToken
  import Kibble from 0xKibble
  import Karat from 0xKarat
  import KittyItems from 0xKittyItems
  import KittyItemsMarket from 0xKittyItemsMarket

  pub fun hasKibble(_ address: Address): Bool {
    let receiver = getAccount(address)
      .getCapability<&Kibble.Vault{FungibleToken.Receiver}>(Kibble.ReceiverPublicPath)
      .check()

    let balance = getAccount(address)
      .getCapability<&Kibble.Vault{FungibleToken.Balance}>(Kibble.BalancePublicPath)
      .check()

    return receiver && balance
  }

  pub fun hasKarat(_ address: Address): Bool {
    let receiver = getAccount(address)
      .getCapability<&Karat.Vault{FungibleToken.Receiver}>(Karat.ReceiverPublicPath)
      .check()

    let balance = getAccount(address)
      .getCapability<&Karat.Vault{FungibleToken.Balance}>(Karat.BalancePublicPath)
      .check()

    return receiver && balance
  }

  pub fun hasItems(_ address: Address): Bool {
    return getAccount(address)
      .getCapability<&KittyItems.Collection{NonFungibleToken.CollectionPublic, KittyItems.KittyItemsCollectionPublic}>(KittyItems.CollectionPublicPath)
      .check()
  }

  pub fun hasMarket(_ address: Address): Bool {
    return getAccount(address)
      .getCapability<&KittyItemsMarket.Collection{KittyItemsMarket.CollectionPublic}>(KittyItemsMarket.CollectionPublicPath)
      .check()
  }

  transaction {
    prepare(acct: AuthAccount) {
      if !hasKibble(acct.address) {
        if acct.borrow<&Kibble.Vault>(from: Kibble.VaultStoragePath) == nil {
          if let oldToken <- acct.load<@FungibleToken.Vault>(from: Kibble.VaultStoragePath) {
            destroy oldToken
          }
          acct.save(<-Kibble.createEmptyVault(), to: Kibble.VaultStoragePath)
        }
        acct.unlink(Kibble.ReceiverPublicPath)
        acct.unlink(Kibble.BalancePublicPath)
        acct.link<&Kibble.Vault{FungibleToken.Receiver}>(Kibble.ReceiverPublicPath, target: Kibble.VaultStoragePath)
        acct.link<&Kibble.Vault{FungibleToken.Balance}>(Kibble.BalancePublicPath, target: Kibble.VaultStoragePath)
      }

      if !hasKarat(acct.address) {
        if acct.borrow<&Karat.Vault>(from: Karat.VaultStoragePath) == nil {
          if let oldToken <- acct.load<@FungibleToken.Vault>(from: Karat.VaultStoragePath) {
            destroy oldToken
          }
          acct.save(<-Karat.createEmptyVault(), to: Karat.VaultStoragePath)
        }
        acct.unlink(Karat.ReceiverPublicPath)
        acct.unlink(Karat.BalancePublicPath)
        acct.link<&Karat.Vault{FungibleToken.Receiver}>(Karat.ReceiverPublicPath, target: Karat.VaultStoragePath)
        acct.link<&Karat.Vault{FungibleToken.Balance}>(Karat.BalancePublicPath, target: Karat.VaultStoragePath)
      }

      if !hasItems(acct.address) {
        if acct.borrow<&KittyItems.Collection>(from: KittyItems.CollectionStoragePath) == nil {
          if let oldToken <- acct.load<@NonFungibleToken.Collection>(from: KittyItems.CollectionStoragePath) {
            destroy oldToken
          }
          acct.save(<-KittyItems.createEmptyCollection(), to: KittyItems.CollectionStoragePath)
        }
        acct.unlink(KittyItems.CollectionPublicPath)
        acct.link<&KittyItems.Collection{NonFungibleToken.CollectionPublic, KittyItems.KittyItemsCollectionPublic}>(KittyItems.CollectionPublicPath, target: KittyItems.CollectionStoragePath)
      }

      if !hasMarket(acct.address) {
        if acct.borrow<&KittyItemsMarket.Collection>(from: KittyItemsMarket.CollectionStoragePath) == nil {
          if let oldToken <- acct.load<@Collection>(from: KittyItemsMarket.CollectionStoragePath) {
            destroy oldToken
          }
          acct.save(<-KittyItemsMarket.createEmptyCollection(), to: KittyItemsMarket.CollectionStoragePath)
        }
        acct.unlink(KittyItemsMarket.CollectionPublicPath)
        acct.link<&KittyItemsMarket.Collection{KittyItemsMarket.CollectionPublic}>(KittyItemsMarket.CollectionPublicPath, target:KittyItemsMarket.CollectionStoragePath)
      }
    }
  }
`

export async function initializeAccount(address, opts = {}) {
  // prettier-ignore
  invariant(address != null, "Tried to initialize an account but no address was supplied")

  return tx(
    [
      transaction(CODE),
      limit(700),
      proposer(authz),
      payer(authz),
      authorizations([authz]),
    ],
    opts
  )
}
