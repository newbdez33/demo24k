import express, { Request, Response, Router } from "express";
import { KaratsService } from "../services/karats";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validate-request";

function initKaratsRouter(karatsService: KaratsService): Router {
  const router = express.Router();

  router.post(
    "/karats/mint",
    [body("recipient").exists(), body("amount").isDecimal()],
    validateRequest,
    async (req: Request, res: Response) => {
      const { recipient, amount } = req.body;

      const transaction = await karatsService.mint(recipient, amount);
      return res.send({
        transaction,
      });
    }
  );

  router.post("/karats/setup", async (req: Request, res: Response) => {
    const transaction = await karatsService.setupAccount();
    return res.send({
      transaction,
    });
  });

  router.post(
    "/karats/burn",
    [
      body("amount").isInt({
        gt: 0,
      }),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      const { amount } = req.body;
      const transaction = await karatsService.burn(amount);
      return res.send({
        transaction,
      });
    }
  );

  router.post(
    "/karats/transfer",
    [
      body("recipient").exists(),
      body("amount").isInt({
        gt: 0,
      }),
    ],
    validateRequest,
    async (req: Request, res: Response) => {
      const { recipient, amount } = req.body;
      const transaction = await karatsService.transfer(recipient, amount);
      return res.send({
        transaction,
      });
    }
  );

  router.get(
    "/karats/balance/:account",
    async (req: Request, res: Response) => {
      const balance = await karatsService.getBalance(req.params.account);
      return res.send({
        balance,
      });
    }
  );

  router.get("/karats/supply", async (req: Request, res: Response) => {
    const supply = await karatsService.getSupply();
    return res.send({
      supply,
    });
  });

  return router;
}

export default initKaratsRouter;
