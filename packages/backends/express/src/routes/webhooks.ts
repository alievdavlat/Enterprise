import { Router, Request, Response, NextFunction } from "express";
import type { DatabaseAdapter } from "@enterprise/database";

export function createWebhookRouter(db: DatabaseAdapter): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await db.findMany("enterprise_webhooks", {
        pagination: { page: 1, pageSize: 100 },
      });
      res.json({ data: result.data, meta: result.meta });
    } catch (err) {
      next(err);
    }
  });

  router.post("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, url, headers, events } = req.body;
      const webhook = await db.create("enterprise_webhooks", {
        name,
        url,
        headers: JSON.stringify(headers || {}),
        events: JSON.stringify(events || []),
        enabled: true,
      });
      res.status(201).json({ data: webhook });
    } catch (err) {
      next(err);
    }
  });

  router.put(
    "/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const idRaw = req.params.id;
        const id = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
        const idVal = Number(id) || id;
        const { name, url, headers, events, enabled } = req.body;
        const payload: Record<string, unknown> = {};
        if (name !== undefined) payload.name = name;
        if (url !== undefined) payload.url = url;
        if (headers !== undefined) payload.headers = typeof headers === "string" ? headers : JSON.stringify(headers || {});
        if (events !== undefined) payload.events = typeof events === "string" ? events : JSON.stringify(Array.isArray(events) ? events : []);
        if (enabled !== undefined) payload.enabled = Boolean(enabled);
        const updated = await db.update(
          "enterprise_webhooks",
          idVal,
          Object.keys(payload).length ? payload : req.body,
        );
        res.json({ data: updated });
      } catch (err) {
        next(err);
      }
    },
  );

  router.delete(
    "/:id",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const idRaw = req.params.id;
        const idVal = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
        const deleted = await db.delete("enterprise_webhooks", Number(idVal) || idVal);
        res.json({ data: deleted });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/:id/trigger",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const idRaw = req.params.id;
        const idVal = (Array.isArray(idRaw) ? idRaw[0] : idRaw) ?? "";
        const webhook = await db.findOne("enterprise_webhooks", Number(idVal) || idVal);
        if (!webhook)
          return res
            .status(404)
            .json({ error: { status: 404, message: "Webhook not found" } });

        // Trigger webhook
        const response = await fetch(webhook.url as string, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...JSON.parse((webhook.headers as string) || "{}"),
          },
          body: JSON.stringify({
            event: "manual.trigger",
            createdAt: new Date().toISOString(),
          }),
        });

        res.json({ data: { triggered: true, status: response.status } });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
