import "express-async-errors";
import express, { Request, Response } from "express";
import Knex from "knex";
import cors from "cors";
import { Model } from "objection";
import { json, urlencoded } from "body-parser";
import { KibblesService } from "./services/kibbles";
import { KaratsService } from "./services/karats";
import { KittyItemsService } from "./services/kitty-items";
import { MarketService } from "./services/market";
import initKaratsRouter from "./routes/karats";
import initKibblesRouter from "./routes/kibbles";
import initKittyItemsRouter from "./routes/kitty-items";
import initMarketRouter from "./routes/market";

const V1 = "/v1/";

// Init all routes, setup middlewares and dependencies
const initApp = (
  knex: Knex,
  karatsService: KaratsService,
  kibblesService: KibblesService,
  kittyItemsService: KittyItemsService,
  marketService: MarketService
) => {
  Model.knex(knex);
  const app = express();

  // @ts-ignore
  app.use(cors());
  app.use(json());
  app.use(urlencoded({ extended: false }));
  app.use(V1, initKaratsRouter(karatsService));
  app.use(V1, initKibblesRouter(kibblesService));
  app.use(V1, initKittyItemsRouter(kittyItemsService));
  app.use(V1, initMarketRouter(marketService));

  app.all("*", async (req: Request, res: Response) => {
    return res.sendStatus(404);
  });

  return app;
};

export default initApp;
