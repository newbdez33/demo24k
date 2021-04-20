import FungibleToken from "../../contracts/FungibleToken.cdc"
import Karat from "../../contracts/Karat.cdc"

// This transaction is a template for a transaction
// to add a Vault resource to their account
// so that they can use the Karat

transaction {

    prepare(signer: AuthAccount) {

        if signer.borrow<&Karat.Vault>(from: Karat.VaultStoragePath) == nil {
            // Create a new Karat Vault and put it in storage
            signer.save(<-Karat.createEmptyVault(), to: Karat.VaultStoragePath)

            // Create a public capability to the Vault that only exposes
            // the deposit function through the Receiver interface
            signer.link<&Karat.Vault{FungibleToken.Receiver}>(
                Karat.ReceiverPublicPath,
                target: Karat.VaultStoragePath
            )

            // Create a public capability to the Vault that only exposes
            // the balance field through the Balance interface
            signer.link<&Karat.Vault{FungibleToken.Balance}>(
                Karat.BalancePublicPath,
                target: Karat.VaultStoragePath
            )
        }
    }
}
