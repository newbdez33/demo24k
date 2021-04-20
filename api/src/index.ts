import * as fcl from "@onflow/fcl";

import Knex from "knex";

import initApp from "./app";
import { getConfig } from "./config";

import { BlockCursorService } from "./services/block-cursor";
import { FlowService } from "./services/flow";
import { KibblesService } from "./services/kibbles";
import { KaratsService } from "./services/karats";
import { KittyItemsService } from "./services/kitty-items";
import { MarketService } from "./services/market";
import { SaleOfferHandler } from "./workers/sale-offer-handler";

let knexInstance: Knex;

async function run() {
  const config = getConfig();

  knexInstance = Knex({
    client: "postgresql",
    connection: config.databaseUrl,
    migrations: {
      directory: config.databaseMigrationPath,
    },
  });

  // Make sure to disconnect from DB when exiting the process
  process.on("SIGTERM", () => {
    knexInstance.destroy().then(() => {
      process.exit(0);
    });
  });

  // Run all database migrations
  await knexInstance.migrate.latest();

  // Make sure we're pointing to the correct Flow Access API.
  fcl.config().put("accessNode.api", config.accessApi);

  const flowService = new FlowService(
    config.minterAddress,
    config.minterPrivateKeyHex,
    config.minterAccountKeyIndex
  );

  const kibblesService = new KibblesService(
    flowService,
    config.fungibleTokenAddress,
    config.minterAddress
  );

  const karatsService = new KaratsService(
    flowService,
    config.fungibleTokenAddress,
    config.minterAddress
  );

  const kittyItemsService = new KittyItemsService(
    flowService,
    config.nonFungibleTokenAddress,
    config.minterAddress
  );

  const marketService = new MarketService(
    flowService,
    config.fungibleTokenAddress,
    config.minterAddress,
    config.nonFungibleTokenAddress,
    config.minterAddress,
    config.minterAddress
  );

  const blockCursorService = new BlockCursorService();

  const saleOfferWorker = new SaleOfferHandler(
    marketService,
    blockCursorService,
    flowService
  );

  const app = initApp(
    knexInstance,
    karatsService,
    kibblesService,
    kittyItemsService,
    marketService
  );

  app.listen(config.port, () => {
    console.log(`Listening on port ${config.port}!`);
  });

  saleOfferWorker.run();
}

const redOutput = "\x1b[31m%s\x1b[0m";

run().catch((e) => {
  console.error(redOutput, e);
  process.exit(1);
});
