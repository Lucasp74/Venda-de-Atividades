import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Migration: add_order_items
 *
 * Cria a tabela order_items para suportar compras de múltiplos produtos
 * em um único pagamento (carrinho de compras).
 *
 * Cada pedido (orders) pode ter N itens (order_items), cada um com seu
 * próprio downloadToken e downloadCount.
 *
 * Backward compatible: pedidos antigos (produto único) continuam
 * funcionando com o downloadToken na tabela orders.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "order_items" (
      "id"              serial        PRIMARY KEY NOT NULL,
      "order_id"        integer       NOT NULL,
      "product_id"      integer,
      "product_title"   varchar       NOT NULL,
      "price"           numeric       NOT NULL,
      "download_token"  varchar       NOT NULL,
      "download_url"    varchar,
      "download_count"  integer       DEFAULT 0 NOT NULL,
      "updated_at"      timestamptz   DEFAULT now() NOT NULL,
      "created_at"      timestamptz   DEFAULT now() NOT NULL
    );
  `)

  await db.execute(`
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_order_id_orders_id_fk"
      FOREIGN KEY ("order_id") REFERENCES "orders"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION;
  `)

  await db.execute(`
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_product_id_products_id_fk"
      FOREIGN KEY ("product_id") REFERENCES "products"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  `)

  await db.execute(`
    CREATE INDEX IF NOT EXISTS "order_items_order_idx"
      ON "order_items" ("order_id");
  `)

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "order_items_token_idx"
      ON "order_items" ("download_token");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`DROP TABLE IF EXISTS "order_items" CASCADE;`)
}
